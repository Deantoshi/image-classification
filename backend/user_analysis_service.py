from database import get_connection


def add_analysis(image_name, object_id_in_image, area_px2, top_left_x, top_left_y,
                 bottom_right_x, bottom_right_y, center, width_px, length_px,
                 volume_px3, solidity, strict_solidity, lw_ratio, area_in2,
                 weight_oz, grade, user_id):
    """Add a new analysis record to the user_analysis table."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO user_analysis (
            image_name, object_id_in_image, area_px2, top_left_x, top_left_y,
            bottom_right_x, bottom_right_y, center, width_px, length_px,
            volume_px3, solidity, strict_solidity, lw_ratio, area_in2,
            weight_oz, grade, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (image_name, object_id_in_image, area_px2, top_left_x, top_left_y,
          bottom_right_x, bottom_right_y, center, width_px, length_px,
          volume_px3, solidity, strict_solidity, lw_ratio, area_in2,
          weight_oz, grade, user_id))

    conn.commit()
    analysis_id = cursor.lastrowid
    conn.close()
    return analysis_id


def get_user_analyses(user_id):
    """Get all analysis records for a specific user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT object_id, image_name, object_id_in_image, area_px2, top_left_x,
               top_left_y, bottom_right_x, bottom_right_y, center, width_px,
               length_px, volume_px3, solidity, strict_solidity, lw_ratio,
               area_in2, weight_oz, grade, user_id
        FROM user_analysis
        WHERE user_id = ?
        ORDER BY object_id
    ''', (user_id,))

    analyses = cursor.fetchall()
    conn.close()
    return analyses


def get_all_analyses():
    """Get all analysis records from the database."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT object_id, image_name, object_id_in_image, area_px2, top_left_x,
               top_left_y, bottom_right_x, bottom_right_y, center, width_px,
               length_px, volume_px3, solidity, strict_solidity, lw_ratio,
               area_in2, weight_oz, grade, user_id
        FROM user_analysis
        ORDER BY object_id
    ''')

    analyses = cursor.fetchall()
    conn.close()
    return analyses


def delete_user_analyses(user_id):
    """Delete all analysis records for a specific user."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM user_analysis WHERE user_id = ?', (user_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected


def delete_analysis(object_id):
    """Delete a specific analysis record by object_id."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM user_analysis WHERE object_id = ?', (object_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected
