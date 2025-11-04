from database import get_connection


def get_or_create_name(name):
    """
    Check if a name exists in the user table. If it doesn't exist, create it.

    Args:
        name (str): The name to search for or create

    Returns:
        dict: A dictionary containing:
            - id: The user ID
            - name: The user name
            - is_new_name: 1 if the name was newly created, 0 if it already existed
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Check if the name already exists
    cursor.execute('SELECT id, name FROM user WHERE name = ?', (name,))
    existing_user = cursor.fetchone()

    if existing_user:
        # Name already exists
        conn.close()
        return {
            'id': existing_user[0],
            'name': existing_user[1],
            'is_new_name': 0
        }
    else:
        # Name doesn't exist, create it
        cursor.execute('INSERT INTO user (name) VALUES (?)', (name,))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()

        return {
            'id': user_id,
            'name': name,
            'is_new_name': 1
        }
