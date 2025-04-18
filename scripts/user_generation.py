import logging
import re
import secrets
import string
from pathlib import Path
from typing import Optional

import bcrypt
import pandas as pd
from mysql_database import MySQLDatabase


def check_for_existing_users(db: MySQLDatabase):
    current_user_table = db.query_to_dataframe("SELECT * FROM users")
    if current_user_table is None:
        raise ValueError("Error loading the users table.")
    elif current_user_table.shape[0] > 0:
        logging.warning("Warning: The users table is not empty..")


def generate_users(
    db: MySQLDatabase,
    num_useres: int,
    password_length: int = 5,
) -> pd.DataFrame:
    """Generate num_useres users with usernames and passwords of length password_length."""
    check_for_existing_users(db)

    users = []
    encrypted_users = []
    for i in range(1, num_useres + 1):
        username = f"user{i}"
        password = "".join(
            secrets.choice(string.ascii_letters + string.digits)
            for _ in range(password_length)
        )
        users.append((username, password))
        encrypted_users.append(
            (username, bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)))
        )

    users = pd.DataFrame(
        users, columns=["username", "password"], index=range(1, len(users) + 1)
    ).rename_axis("id")

    db.insert_records("users", encrypted_users, columns=["username", "password"])
    return users


class UserHandoutGenerator:
    def __init__(
        self, users: pd.DataFrame, width=40, output_dir: Optional[Path] = None
    ):
        self.users = users
        self.width = width
        self.handouts = self.generate_handouts()
        self.output_dir = Path.cwd() if output_dir is None else output_dir

    def generate_handouts(self) -> dict:
        """Generates handouts for each user."""
        handouts = {}
        for _, user_info in self.users.iterrows():
            filename = f"{user_info['username']}.txt"
            message = (
                "=" * self.width
                + "\n"
                + "User Information".center(self.width)
                + "\n"
                + "=" * self.width
                + "\n"
                + f"Username: {user_info['username']}".center(self.width)
                + "\n"
                + f"Password: {user_info['password']}".center(self.width)
                + "\n"
                + "=" * self.width
                + "\n"
            )
            handouts[filename] = message

        return handouts

    def save_handouts_as_rtf(self, font_size=24, bold=True):
        """Converts handouts to RTF format and saves them to files."""
        for filename, message in self.handouts.items():
            rtf_filename = filename.replace(".txt", ".rtf")
            rtf_content = (
                self._generate_rtf_header(font_size)
                + self._apply_bold(self._format_message(message), bold)
                + "\\par}"
            )

            # Save the RTF file
            with open(self.output_dir / rtf_filename, "w") as file:
                file.write(rtf_content)

    def save_handouts_in_combined_rtf(
        self,
        font_size=24,
        bold=True,
        rtf_filename="combined_handouts.rtf",
    ):
        """Converts handouts to RTF format and saves them to a single file."""
        output_path = self.output_dir / rtf_filename
        rtf_content = self._generate_rtf_header(font_size)

        # Prepare the content for the RTF file
        content = []
        separator = "\\line" + "-" * self.width + "\\line" + "\\line" + "\n"

        for i, (_, message) in enumerate(self.handouts.items()):
            content.append(self._format_message(message))

            # Add a separator between handouts
            if (i + 1) % 4 == 0:
                content.append("\\line" + "\\line" + "\\line")
                content.append("\\page" + "\n")
            else:
                content.append(separator)

        # Join the content with the separator
        rtf_content += self._apply_bold("\n".join(content), bold) + "\\par}"

        # Save the RTF file
        with open(output_path, "w") as file:
            file.write(rtf_content)

    def _generate_rtf_header(self, font_size: int) -> str:
        """Generates the RTF header."""
        return (
            "{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat\\deflang1033"
            "{\\fonttbl{\\f0\\fnil\\fcharset0 Courier New;}}"
            "{\\*\\generator Riched20 10.0.18362;}\\viewkind4\\uc1 "
            f"\\pard\\f0\\fs{font_size * 2} "
        )

    def _apply_bold(self, content: str, bold: bool) -> str:
        """Applies bold formatting to the content if specified."""
        return f"\\b {content}\\b0" if bold else content

    def _format_message(self, message: str) -> str:
        """Formats the message for RTF by replacing newlines."""
        return re.sub(r"\n", r"\\line\\n", message)

    @classmethod
    def populate_users(
        cls, db: MySQLDatabase, num_useres: int, password_length: int = 5, **kwargs
    ) -> "UserHandoutGenerator":
        """Populates the users DataFrame from the database."""
        users = generate_users(
            db, num_useres=num_useres, password_length=password_length
        )
        return cls(users=users, **kwargs)
