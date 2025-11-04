from database import get_connection


def add_image_match(image_name, user_id):
    """
    Add a new image match to the database.

    Args:
        image_name (str): The name of the image
        user_id (int): The ID of the user associated with this image

    Returns:
        dict: A dictionary containing:
            - image_id: The newly created image ID
            - image_name: The image name
            - user_id: The user ID
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        'INSERT INTO image_match (image_name, user_id) VALUES (?, ?)',
        (image_name, user_id)
    )
    conn.commit()
    image_id = cursor.lastrowid
    conn.close()

    return {
        'image_id': image_id,
        'image_name': image_name,
        'user_id': user_id
    }


def get_images_by_user(user_id):
    """
    Get all images associated with a specific user.

    Args:
        user_id (int): The ID of the user

    Returns:
        list: A list of dictionaries, each containing:
            - image_id: The image ID
            - image_name: The image name
            - user_id: The user ID
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        'SELECT image_id, image_name, user_id FROM image_match WHERE user_id = ?',
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()

    images = []
    for row in rows:
        images.append({
            'image_id': row[0],
            'image_name': row[1],
            'user_id': row[2]
        })

    return images
