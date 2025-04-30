from mysql_database import MySQLDatabase
# from user_generation import generate_users, UserHandoutGenerator
# from create_user_views import create_user_view_mapping_with_and_without_transits,insert_dataframe_into_database, count_files
from user_generation import *
from create_user_views import *
from pathlib import Path
import pandas as pd

def parse_args():
    """Parse command line arguments.
    Example
    -------
    >>> python create_user_views.py --n_views 10 --delay 3 --n_images 20 --mode production
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Create user image views for classification tasks."
    )
    parser.add_argument(
        "--n_views", type=int, default=5, help="Number of views per image."
    )
    parser.add_argument(
        "--delay", type=int, default=5, help="Delay for transit images."
    )
    parser.add_argument(
        "--n_images", type=int, default=count_files(), help="Number of images."
    )
    parser.add_argument(
        "--mode",
        type=str,
        default="development",
        help="Config mode (development/production).",
    )
    parser.add_argument(
        "--num_users", type=int, default=10, help="Number of users to generate."
    )
    parser.add_argument(
        "--password_length",
        type=int,
        default=5,
        help="Length of the generated passwords.",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default=Path(__file__).parent / "output",
        help="Directory to save handouts.",
    )

    return parser.parse_args()



if __name__ == "__main__":
    args= parse_args()
    logging.info(
        f"Creating user image views with {args.n_images} images, {args.n_views} views per image, "
        f"and a delay of {args.delay}."
    )
    logging.info(
        f"Generating {args.num_users} users with password length {args.password_length}."
    )

    db = MySQLDatabase.from_config(mode=args.mode)
    # Generate first half of the users
    users1 = generate_users( 
        db=db, num_useres=args.num_users, password_length=args.password_length
    )
    #generate assignment of first half of users
    records1= create_user_view_mapping_with_and_without_transits(
        db, args.n_images, args.n_views, delay=args.delay
    )
    logging.info(f"Generated {len(records1)} records for user image views.")
    insert_dataframe_into_database(db, records1)
    logging.info(f"Inserted {len(records1)} records for image views into database.")

    # Generate second half of the users
    users2 = generate_users(
        db=db, num_useres=args.num_users, password_length=args.password_length
    )   
    logging.info(f"Generated another {len(users2)} users.")
    #combine the 2 user-frames for complete handout
    combined_users= pd.concat([users1, users2], ignore_index=True)

    #generate assingment of second half of users
    records2=records1.copy()
    records2["user_id"] += args.num_users
    #insert second half of assignments into database
    insert_dataframe_into_database(db, records2)
    logging.info(f"Inserted another {len(records2)} records for user image views nto database.")

    user_handout_generator = UserHandoutGenerator(
        users=combined_users,
        output_dir=Path(args.output_dir),
    )
    user_handout_generator.save_handouts_in_combined_rtf()
    # users to json
    combined_users.to_csv(
        Path(args.output_dir) / "users.csv",
        index=False,
    )