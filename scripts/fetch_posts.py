from mysql_database import MySQLDatabase

if __name__ == "__main__":
    db = MySQLDatabase(
        database="htd",
        username="root",
        # password="myPassword",
        host="localhost",
    )
    df = db.query_to_dataframe("SELECT * FROM posts")

    if df is not None:
        df.to_csv("posts.csv", index=False)
