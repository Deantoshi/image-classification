import sqlite3
import os

# Database file path
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')


def get_connection():
    """Get a database connection with WAL mode enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')
    return conn


def init_db():
    """Initialize the database and create tables if they don't exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # Create user table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    ''')

    # Create image_match table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS image_match (
            image_id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_name TEXT NOT NULL,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    ''')

    # Create user_analysis table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_analysis (
            object_id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_name TEXT NOT NULL,
            object_id_in_image INTEGER,
            area_px2 REAL,
            top_left_x INTEGER,
            top_left_y INTEGER,
            bottom_right_x INTEGER,
            bottom_right_y INTEGER,
            center TEXT,
            width_px REAL,
            length_px REAL,
            volume_px3 REAL,
            solidity REAL,
            strict_solidity REAL,
            lw_ratio REAL,
            area_in2 REAL,
            weight_oz REAL,
            grade TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    ''')

    conn.commit()
    conn.close()


def add_user(name):
    """Add a new user to the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO user (name) VALUES (?)', (name,))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def get_user(user_id):
    """Get a user by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name FROM user WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    return user


def get_all_users():
    """Get all users from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name FROM user')
    users = cursor.fetchall()
    conn.close()
    return users


def delete_user(user_id):
    """Delete a user by ID."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM user WHERE id = ?', (user_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    return rows_affected


# Initialize the database when the module is imported
if __name__ == '__main__':
    init_db()
    print(f"Database initialized at {DB_PATH}")
