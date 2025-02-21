from functools import lru_cache
from models import NewsEvent
import logging


# Define a cache for the get_all method of NewsEvent
@lru_cache(maxsize=128)
def get_cached_news_events(page=1, limit=10, type=None, sort_by="created_at", order=-1):
    """
    Caches the result of the NewsEvent.get_all method.

    :param page: The page number for pagination.
    :param limit: The number of items per page.
    :param type: The type of news/event to filter by.
    :param sort_by: The field to sort by.
    :param order: The order of sorting (1 for ascending, -1 for descending).
    :return: A dictionary containing the cached news/events.
    """
    # Add debug logging
    logging.info(f"Cache request for {type} items")
    print(f"Fetching news/events with type: {type}, page: {page}, limit: {limit}")

    # Get fresh data from database
    result = NewsEvent.get_all(page, limit, type, sort_by, order)

    # Add debug logging
    logging.info(f"Retrieved {len(result['items'])} items from database")
    print(f"Fetched news/events: {result}")

    return result
