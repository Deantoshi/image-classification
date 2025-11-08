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
            price_usd REAL,
            grade TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    ''')

    # Create user_profit table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            scenario INTEGER NOT NULL,
            total_profit REAL,
            total_revenue REAL,
            total_penalty REAL,
            marketable_proportion REAL,
            not_marketable_proportion REAL,
            total_classifications INTEGER,
            total_marketable_classifications INTEGER,
            total_not_marketable_classifications INTEGER,
            total_marketable_revenue REAL,
            total_not_marketable_revenue REAL,
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


def save_user_profit(user_id, scenario, profit_data):
    """Save or update user profit data. Uses REPLACE to avoid duplicates."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO user_profit (
            user_id, scenario, total_profit, total_revenue, total_penalty,
            marketable_proportion, not_marketable_proportion,
            total_classifications, total_marketable_classifications,
            total_not_marketable_classifications, total_marketable_revenue,
            total_not_marketable_revenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        scenario,
        profit_data.get('total_profit'),
        profit_data.get('total_revenue'),
        profit_data.get('total_penalty'),
        profit_data.get('marketable_proportion'),
        profit_data.get('not_marketable_proportion'),
        profit_data.get('total_classifications'),
        profit_data.get('total_marketable_classifications'),
        profit_data.get('total_not_marketable_classifications'),
        profit_data.get('total_marketable_revenue'),
        profit_data.get('total_not_marketable_revenue')
    ))
    conn.commit()
    profit_id = cursor.lastrowid
    conn.close()
    return profit_id


def get_user_profit(user_id, scenario=None):
    """Get user profit data by user ID and optionally scenario."""
    conn = get_connection()
    cursor = conn.cursor()

    if scenario is not None:
        cursor.execute('''
            SELECT id, user_id, scenario, total_profit, total_revenue, total_penalty,
                   marketable_proportion, not_marketable_proportion,
                   total_classifications, total_marketable_classifications,
                   total_not_marketable_classifications, total_marketable_revenue,
                   total_not_marketable_revenue
            FROM user_profit
            WHERE user_id = ? AND scenario = ?
        ''', (user_id, scenario))
        profit = cursor.fetchone()
    else:
        cursor.execute('''
            SELECT id, user_id, scenario, total_profit, total_revenue, total_penalty,
                   marketable_proportion, not_marketable_proportion,
                   total_classifications, total_marketable_classifications,
                   total_not_marketable_classifications, total_marketable_revenue,
                   total_not_marketable_revenue
            FROM user_profit
            WHERE user_id = ?
        ''', (user_id,))
        profit = cursor.fetchall()

    conn.close()
    return profit


# Initialize the database when the module is imported
if __name__ == '__main__':
    init_db()
    print(f"Database initialized at {DB_PATH}")
