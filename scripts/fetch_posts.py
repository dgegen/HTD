"""
## Python Environment Setup

To run this script, please install the required packages by executing the following command:

```bash
pip install mysql-connector-python pandas sqlalchemy
```
"""

import logging
from typing import Optional

import mysql.connector
import pandas as pd
from sqlalchemy import Engine, create_engine


class MySQLDatabase:
    """
    MySQLDatabase is a class for interacting with a MySQL database using SQLAlchemy.
    It provides methods to execute queries and return results in various formats.

    Attributes
    ----------
    database : str
        The name of the database.
    username : str
        The username for the database.
    password : str or None
        The password for the database.
    host : str
        The host address of the database.

    Methods
    -------
    query_to_dataframe(query: str) -> Optional[pd.DataFrame]
        Executes a query and returns the results as a DataFrame.

    query(query: str)
        Executes a query and returns the results as a list of tuples.

    Examples
    --------
    >>> db = MySQLDatabase(
    ...     database="myDatabse",
    ...     username="myUsername",
    ...     password="myPassword",
    ...     host="localhost"
    ... )
    >>> df = db.query_to_dataframe("SELECT * FROM myTable")
    >>> print(df)
    """

    def __init__(
        self,
        database: str,
        username: str,
        password: Optional[str] = None,
        host: str = "localhost",
    ):
        self.database = database
        self.username = username
        self.password = password
        self.host = host
        self.engine = self._create_engine()

    def query_to_dataframe(self, query: str) -> Optional[pd.DataFrame]:
        """Executes a query and returns the results as a DataFrame."""
        try:
            results = pd.read_sql_query(query, self.engine)
            return results
        except mysql.connector.Error as error:
            logging.error(f"Error querying MySQL database: {error}")

    def query(self, query: str):
        """Executes a query and returns the results as a list of tuples."""
        connection = None
        cursor = None
        try:
            # Connect to the database
            connection = mysql.connector.connect(
                user=self.username,
                password=self.password,
                database=self.database,
                host=self.host,
            )
            cursor = connection.cursor()
            cursor.execute(query)
            results = cursor.fetchall()

        except mysql.connector.Error as error:
            logging.error(f"Error querying MySQL database: {error}")
            results = None

        finally:
            self._close_cursor(cursor)
            self._close_connection

        return results

    def _create_engine(self) -> Engine:
        """Constructs the SQLAlchemy engine for MySQL."""
        url = self._create_url()
        return create_engine(url)

    def _create_url(self) -> str:
        """Constructs the SQLAlchemy URL for MySQL."""
        url = (
            f"mysql+mysqlconnector://{self.username}"
            + (f":{self.password}" if self.password else "")
            + f"@{self.host}/{self.database}"
        )
        return url

    @staticmethod
    def _close_cursor(cursor):
        """Closes a cursor."""
        if cursor:
            try:
                cursor.close()
            except Exception:
                print("Error closing cursor")

    @staticmethod
    def _close_connection(connection):
        """Closes a connection."""
        if connection:
            try:
                connection.close()
            except Exception:
                print("Error closing connection")


if __name__ == "__main__":
    db = MySQLDatabase(
        database="htd",
        username="root",
        # password="myPassword",
        host="localhost",
    )
    df = db.query_to_dataframe("SELECT * FROM posts")
    df.to_csv("posts.csv", index=False)
