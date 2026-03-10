import time
import asyncio
import functools

def retry_sync(max_retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    Retry decorator cho các hàm chạy đồng bộ (sync).
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    if retries >= max_retries:
                        print(f"--> [Retry] Lỗi hàm {func.__name__} sau {max_retries} lần thử: {e}")
                        raise e
                    print(f"--> [Retry] Hàm {func.__name__} lỗi: {e}. Thử lại lần {retries}/{max_retries} sau {current_delay}s...")
                    time.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator

def retry_async(max_retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    Retry decorator cho các hàm chạy bất đồng bộ (async).
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay
            while retries < max_retries:
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    if retries >= max_retries:
                        print(f"--> [Retry] Lỗi coroutine {func.__name__} sau {max_retries} lần thử: {e}")
                        raise e
                    print(f"--> [Retry] Coroutine {func.__name__} lỗi: {e}. Thử lại lần {retries}/{max_retries} sau {current_delay}s...")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        return wrapper
    return decorator
