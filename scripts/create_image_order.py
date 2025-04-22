from typing import Optional

import numpy as np
import pandas as pd
from mysql_database import MySQLDatabase


def create_user_view_mapping(
    db: MySQLDatabase,
    n_images: int,
    n_views: int,
    shuffle_images=True,
    rng: np.random.RandomState = np.random.RandomState(42),
) -> pd.DataFrame:
    """
    Generate a DataFrame mapping user IDs to image IDs for classification tasks,
    ensuring that each image is viewed by a specific number of different users.
    """
    user_ids = db.fetch_user_ids()
    if n_views > len(user_ids):
        raise ValueError("n_views must be less than or equal to the number of users")

    file_ids = np.arange(1, n_images + 1)
    # if shuffle_images:
    #     rng.shuffle(file_ids)
    total_assignments = n_images * n_views
    user_cycle = np.tile(user_ids, total_assignments // len(user_ids) + 1)[
        :total_assignments
    ]

    assignments = np.column_stack(
        [
            user_cycle,  # Users are evenly distributed
            np.repeat(file_ids, n_views),  # Repeat image IDs accordingly
        ]
    )
    if shuffle_images:
        rng.shuffle(assignments)

    df = pd.DataFrame(assignments, columns=["user_id", "file_id"])
    df["view_order"] = df.groupby("user_id").cumcount() + 1

    return df


def create_user_view_mapping_with_and_without_transits(
    db: MySQLDatabase,
    n_images: int,
    n_views: int,
    shuffle_images=True,
    rng: np.random.RandomState = np.random.RandomState(42),
    delay: int = 10,
) -> pd.DataFrame:
    """
    Generate a DataFrame mapping user IDs to image IDs for classification tasks,
    ensuring that each image is viewed by a specific number of different users,
    and that each participant who sees image i also sees image n_images + i
    with a delay of 20 images.

    The effective median delay distance is 2 * delay - 1. That is for a delay of 10,
    the distance between the two images is 19, except for some of the first and last images.
    """
    df = create_user_view_mapping(db, n_images, n_views, shuffle_images, rng).drop(
        columns=["view_order"]
    )

    transit_df = df.copy()
    transit_df["file_id"] += n_images
    transit_df = transit_df.reindex(index=np.roll(df.index, -delay))

    combined_df = pd.concat([df, transit_df], ignore_index=True)
    combined_df.iloc[0::2, :] = df
    combined_df.iloc[1::2, :] = transit_df

    combined_df["view_order"] = combined_df.groupby("user_id").cumcount() + 1

    return combined_df


def insert_user_image_views(
    db: MySQLDatabase, n_images: int, n_views: int, delay: Optional[int] = None
):
    if delay is not None:
        records = create_user_view_mapping_with_and_without_transits(
            db, n_images, n_views, delay=delay
        )
    else:
        records = create_user_view_mapping(db, n_images, n_views)

    records = [tuple(row) for row in records.to_numpy().astype(int).tolist()]

    db.insert_records(
        "UserViews", records, columns=["user_id", "file_id", "view_order"]
    )


if __name__ == "__main__":
    db = MySQLDatabase.from_config(mode="development")
    insert_user_image_views(db, n_images=25, n_views=5, delay=5)
