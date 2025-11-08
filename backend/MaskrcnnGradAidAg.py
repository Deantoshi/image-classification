# -*- coding: utf-8 -*-
"""
Image processing script for object detection, feature extraction,
and analysis using Detectron2.

This script processes images from an input directory, performs instance
segmentation, extracts various dimensional features of detected objects,
calculates weight and assigns grades, and saves the results to CSV files
and annotated images to an output directory.
"""

from collections import defaultdict
import os
import random
from time import sleep
import cv2
import numpy as np
import pandas as pd
import torch
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor

# ==============================================================================
# --- Configuration & Constants ---
# ==============================================================================

# --- Path Configuration ---
# Ensure these paths are correct for your environment
# --- Path Configuration ---
# These paths are now relative to the script inside the container,
# matching your original logic.
INPUT_PATH = "input"
OUTPUT_PATH = "output"
DETECTRON2_CONFIG_PATH = "detectron2/configs/COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
MODEL_WEIGHTS_PATH = "model_final.pth"

# --- CUDA Configuration ---
# Set CUDA device order and visibility. PCI_BUS_ID ensures device IDs are consistent.
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = "0" # Use GPU 0

# --- Detectron2 Model Configuration ---
MODEL_CONF = {
    "NUM_WORKERS": 1,
    "ROI_HEADS_NUM_CLASSES": 1,  # Number of classes (e.g., 1 for 'object')
    "SCORE_THRESH_TEST": 0.1,    # Confidence threshold for detections
    "DETECTIONS_PER_IMAGE": 1000 # Max detections per image
}

# --- Image Processing Parameters ---
IMG_SUFFIXES = ('png', 'jpg', 'jpeg', 'tiff', 'tif') # Added 'tif' for completeness
DEFAULT_OUTPUT_SCALE = 1.0 # Scale for output images
DEFAULT_CONTOUR_THICKNESS = 10 # Thickness for drawing contours
DEFAULT_BORDER_FILTER_PIXELS = 0 # Pixels from border to ignore detections

# --- Physical Conversion Constants ---
# Used for calculating real-world dimensions and weight
INCHES_PER_PIXEL = 9 / 425  # Example: 9 inches corresponds to 425 pixels
FUDGE_FACTOR = 1.5          # Adjusts area in weight calculation

# ==============================================================================
# --- Utility Functions ---
# ==============================================================================

def check_cuda():
    """Checks CUDA availability and prints status."""
    if torch.cuda.is_available():
        print('CUDA is available. But Using CPU.')
        return "cpu"
    else:
        print('CUDA is not available. Processing will use CPU and may be slow.')
        return "cpu"

# def assign_grade(weight_oz):
#     """Assigns a grade based on weight in ounces."""
#     if weight_oz < 1.5: return 'Not Marketable'
#     if weight_oz < 3:   return 'Not Marketable'
#     if weight_oz < 5.3: return 'Not Marketable'
#     if weight_oz < 10.6:return 'Medium'
#     if weight_oz < 15.9:return 'Large 1'
#     if weight_oz < 21.2:return 'Large 2'
#     if weight_oz < 28.2:return 'Extra Large'
#     return 'Not Marketable'

def assign_grade(weight_oz):
    """Assigns a grade based on weight in ounces."""
    if 5.3 <= weight_oz < 28.2:
        return 'Marketable'
    else:
        return 'Not Marketable'
    
def random_saturated_color():
    """Generates a random saturated color tuple (BGR)."""
    trip = [0, 255, random.randint(0, 255)]
    random.shuffle(trip)
    return tuple(trip)

def draw_text_centered(img, text, loc, fontFace=cv2.FONT_HERSHEY_SIMPLEX,
                       fontScale=3, thickness=5, bg_color=(255, 255, 255),
                       text_color=(0, 0, 0)):
    """Draws text centered at a location on the image with a background."""
    textsize = cv2.getTextSize(text, fontFace, fontScale, thickness)[0]
    textX_left = max(loc[0] - (textsize[0] // 2), 0)
    textY_bot = min(loc[1] + (textsize[1] // 2), img.shape[0])
    textX_right = min(loc[0] + (textsize[0] // 2), img.shape[1])
    textY_top = max(loc[1] - (textsize[1] // 2), 0)

    cv2.rectangle(img, (textX_left, textY_top), (textX_right, textY_bot), bg_color, -1)
    cv2.putText(img, text, (textX_left, textY_bot), fontFace, fontScale, text_color, thickness)
    return img

def extract_contour_dimensions(cnt):
    """Extracts various geometric properties from a single contour."""
    res = {}
    res['area'] = area = cv2.contourArea(cnt)
    if area < 10: # Filter out very small contours early
        return None

    perimeter = cv2.arcLength(cnt, True)
    hull = cv2.convexHull(cnt)

    x, y, w, h = cv2.boundingRect(cnt)
    res['top_left_x'] = x
    res['top_left_y'] = y
    res['bottom_right_x'] = x + w
    res['bottom_right_y'] = y + h

    rect = cv2.minAreaRect(cnt) # ((center_x, center_y), (width, height), angle)
    res['center'] = center = tuple(map(int, rect[0]))
    
    # Ensure width is the smaller dimension and length is the larger
    dimension1, dimension2 = rect[1]
    res['width'] = min(dimension1, dimension2)
    res['length'] = max(dimension1, dimension2)

    # Volume approximation (assuming prolate spheroid shape based on area and min dimension)
    # V = Area * (4/3) * (width/2) - simplified from V = (4/3) * pi * a * b^2 where area ~ pi*a*b
    res['volume'] = area * (4/3) * (res['width'] / 2) if res['width'] > 0 else 0

    hull_cnt_area = cv2.contourArea(hull)
    hull_cnt_perimeter = cv2.arcLength(hull, True)

    res['solidity'] = area / hull_cnt_area if hull_cnt_area > 0 else 0
    res['strict_solidity'] = (res['solidity'] * (hull_cnt_perimeter / perimeter)
                               if perimeter > 0 and hull_cnt_area > 0 else 0)
    return res

def initialize_predictor(device):
    """Initializes and returns the Detectron2 DefaultPredictor."""
    cfg = get_cfg()
    cfg.merge_from_file(DETECTRON2_CONFIG_PATH)
    cfg.DATALOADER.NUM_WORKERS = MODEL_CONF["NUM_WORKERS"]
    cfg.MODEL.DEVICE = device
    cfg.MODEL.ROI_HEADS.NUM_CLASSES = MODEL_CONF["ROI_HEADS_NUM_CLASSES"]
    cfg.MODEL.WEIGHTS = MODEL_WEIGHTS_PATH
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = MODEL_CONF["SCORE_THRESH_TEST"]
    cfg.TEST.DETECTIONS_PER_IMAGE = MODEL_CONF["DETECTIONS_PER_IMAGE"]
    
    try:
        predictor = DefaultPredictor(cfg)
        print("Detectron2 predictor initialized successfully.")
        return predictor
    except Exception as e:
        print(f"Error initializing DefaultPredictor: {e}")
        print("Please ensure Detectron2 is installed correctly and model paths are valid.")
        exit(1) # Exit if predictor fails to initialize

# ==============================================================================
# --- Core Image Processing Function ---
# ==============================================================================

def process_image_features(predictor, img, img_base_name, current_csv_row_start_index,
                           output_scale=DEFAULT_OUTPUT_SCALE,
                           contour_thickness=DEFAULT_CONTOUR_THICKNESS,
                           border_filter_pixels=DEFAULT_BORDER_FILTER_PIXELS):
    """
    Performs inference on an image, extracts features from detected objects,
    draws detections, and returns a DataFrame of features.
    """
    if border_filter_pixels < 0:
        raise ValueError("Border filter width cannot be less than 0.")

    height, width = img.shape[:2]
    filter_array = None
    if border_filter_pixels > 0:
        filter_array = np.ones((height, width), dtype=np.uint8)
        filter_array[border_filter_pixels : height - border_filter_pixels,
                     border_filter_pixels : width - border_filter_pixels] = 0

    outputs = predictor(img)
    predictions = outputs["instances"].to("cpu")
    masks = predictions.get("pred_masks").numpy().astype(np.uint8) * 255

    extracted_data = defaultdict(list)
    img_to_draw_on = img.copy()
    detected_object_count = 0
    next_csv_row_to_assign = current_csv_row_start_index #initialize a variabel to manage csv row numbers for this image objects

    for mask_idx, mask in enumerate(masks):
        contours, _ = cv2.findContours(mask, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue

        # If a single mask yields multiple contours, take the largest one
        main_contour = max(contours, key=cv2.contourArea)

        dims = extract_contour_dimensions(main_contour)
        if dims is None: # Skips if area < 10 (handled in extract_contour_dimensions)
            continue

        # Border filtering: check if any part of the contour is in the border region
        if border_filter_pixels > 0 and filter_array is not None:
            temp_contour_mask = np.zeros(mask.shape[:2], dtype=np.uint8)
            cv2.drawContours(temp_contour_mask, [main_contour], -1, 255, -1)
            if np.any(np.logical_and(temp_contour_mask, filter_array)):
                continue # Skip this contour as it touches the border

        cv2.drawContours(img_to_draw_on, [main_contour], -1,
                         random_saturated_color(), contour_thickness)
        
        #--- Draw the CSV row number on the image ---
        center_x, center_y = dims['center']
        draw_text_centered(img_to_draw_on, str(next_csv_row_to_assign + 1),
                           (center_x, center_y),
                           fontScale=1,  # Adjusted for visibility as an ID
                           thickness=2,  # Adjusted for visibility
                           bg_color=(255, 255, 255), # Ensuring background for text
                           text_color=(0, 0, 0))     # Ensuring text color
        
        detected_object_count += 1
        extracted_data['image_name'].append(img_base_name)
        extracted_data['object_id_in_image'].append(mask_idx) # Unique ID for object in this image
        for key, value in dims.items():
            # Adjust column names for clarity
            if key == 'area': extracted_data['area_px2'].append(value)
            elif key == 'width': extracted_data['width_px'].append(value)
            elif key == 'length': extracted_data['length_px'].append(value)
            elif key == 'volume': extracted_data['volume_px3'].append(value)
            else: extracted_data[key].append(value)
        
        next_csv_row_to_assign += 1 # increment the csv row number for the next object

    df = pd.DataFrame(extracted_data)
    if not df.empty:
        df.index.name = 'detection_index'

    # Save the output image with detections
    output_filename = os.path.join(OUTPUT_PATH, f"masked_{img_base_name}")
    if output_scale != 1.0:
        h, w = img_to_draw_on.shape[:2]
        new_h, new_w = int(h * output_scale), int(w * output_scale)
        img_to_draw_on = cv2.resize(img_to_draw_on, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    try:
        cv2.imwrite(output_filename, img_to_draw_on)
    except Exception as e:
        print(f"Error writing image {output_filename}: {e}")

    return df, detected_object_count, next_csv_row_to_assign

# ==============================================================================
# --- Data Aggregation and Final Processing ---
# ==============================================================================

def finalize_data_and_save(all_data_frames, output_dir):
    """
    Combines all dataframes, calculates additional metrics (weight, grade),
    and saves the final CSV.
    """
    if not all_data_frames:
        print("No dataframes to process. Skipping finalization.")
        return

    combined_df = pd.concat(all_data_frames, ignore_index=True)
    if combined_df.empty:
        print("Combined DataFrame is empty. No data to save.")
        return

    # --- MODIFICATION START ---
    # Set the index to be 1-based instead of 0-based for the final CSV.
    combined_df.index += 1
    combined_df.index.name = 'object_id'
    # --- MODIFICATION END ---

    required_cols = ['area_px2', 'length_px', 'width_px']
    if not all(col in combined_df.columns for col in required_cols):
        missing_cols = [col for col in required_cols if col not in combined_df.columns]
        print(f"Warning: Missing required columns for weight calculation: {missing_cols}.")
        print("Attempting to save partial data.")
        csv_path = os.path.join(output_dir, 'combined_analysis_partial.csv')
    else:
        # Calculate real-world dimensions and weight
        combined_df["lw_ratio"] = combined_df["length_px"].replace(0, np.nan) / combined_df["width_px"].replace(0, np.nan) # Avoid division by zero
        combined_df["area_in2"] = combined_df["area_px2"] * (INCHES_PER_PIXEL**2)

        log_arg = combined_df["area_in2"] * FUDGE_FACTOR
        log_arg_safe = np.where(log_arg > 0, log_arg, np.nan) # Ensure log argument is positive

        combined_df["weight_oz"] = (
            10**(1.465 * np.log10(log_arg_safe) + 0.8749) * 0.03527396
        )
        #combined_df["axiallength_in"] = combined_df["length_px"] * INCHES_PER_PIXEL
        #combined_df["maxdiameter_in"] = combined_df["width_px"] * INCHES_PER_PIXEL
        combined_df['Grade'] = combined_df['weight_oz'].apply(lambda x: assign_grade(x) if pd.notnull(x) else None)
        
        combined_df['Price USD'] = np.where(combined_df['Grade'] == 'Marketable', 0.56, 
                                       np.where(combined_df['Grade'] == 'Not Marketable', 0.008, np.nan))
        
        csv_path = os.path.join(output_dir, 'combined_analysis_with_grades.csv')

    try:
        combined_df.to_csv(csv_path, index=True, encoding='utf-8')
        print(f"\nProcessing complete. Data saved to: {csv_path}")
    except Exception as e:
        print(f"Error saving CSV to {csv_path}: {e}")

    # Print Summaries
    total_images_with_data = len(set(combined_df['image_name'])) if 'image_name' in combined_df else 0
    print(f"Total images from which data was extracted: {total_images_with_data}")

    if 'Grade' in combined_df.columns:
        print("\n--- Grade Distribution ---")
        print(combined_df['Grade'].value_counts(dropna=False))

    if 'weight_oz' in combined_df.columns:
        print("\n--- Weight Statistics (oz) ---")
        print(combined_df['weight_oz'].describe())

# ==============================================================================
# --- Main Execution ---
# ==============================================================================

def main():
    """Main function to orchestrate the image processing pipeline."""
    
    device = check_cuda() # Check CUDA and set device
    predictor = initialize_predictor(device)

    # --- Prepare for Processing ---
    if not os.path.exists(OUTPUT_PATH):
        os.makedirs(OUTPUT_PATH)
        print(f"Created output directory: {OUTPUT_PATH}")

    all_image_files = []
    for root, _, files in os.walk(INPUT_PATH):
        for f_name in files:
            if f_name.lower().endswith(IMG_SUFFIXES):
                all_image_files.append((root, f_name))
    
    all_image_files.sort(key=lambda x: x[1]) # Sort by filename for consistent order

    if not all_image_files:
        print(f"No images found in {INPUT_PATH} with suffixes {IMG_SUFFIXES}.")
        return

    print(f"Found {len(all_image_files)} images to potentially process.")

    all_processed_data_frames = []
    processed_image_count = 0
    global_csv_row_counter = 0 # initialize global counter for CSV row numbers

    for i, (root, file_iter_name) in enumerate(all_image_files):
        img_basename = os.path.basename(file_iter_name)
        fullpath = os.path.join(root, file_iter_name)

        print(f"\nProcessing image {i + 1}/{len(all_image_files)}: {file_iter_name}")
        
        img_in = cv2.imread(fullpath)
        if img_in is None:
            print(f"Error: Could not read image {fullpath}. Skipping.")
            continue

        # Pass global_csv_row_counter and receive the updated counter
        df_features, num_detections, updated_global_csv_counter = process_image_features(
            predictor,
            img_in,
            img_basename,
            global_csv_row_counter, # Pass the current global CSV row counter
            output_scale=DEFAULT_OUTPUT_SCALE,
            contour_thickness=DEFAULT_CONTOUR_THICKNESS,
            border_filter_pixels=DEFAULT_BORDER_FILTER_PIXELS
        )
        global_csv_row_counter = updated_global_csv_counter #update global csv row counter with returned value
        
        processed_image_count += 1
        if df_features is not None and not df_features.empty:
            all_processed_data_frames.append(df_features)
            print(f"Successfully processed {file_iter_name}. Detected {num_detections} objects.")
        else:
            print(f"No valid objects detected in {file_iter_name} after filtering.")
        
        sleep(0.1) # Small delay between processing images

    # --- Finalize and Save ---
    finalize_data_and_save(all_processed_data_frames, OUTPUT_PATH)
    print(f"\nTotal images attempted for processing: {processed_image_count}")

if __name__ == "__main__":
    print("--- Starting Image Processing Script ---")
    main()
    print("\n--- Script Execution Finished ---")