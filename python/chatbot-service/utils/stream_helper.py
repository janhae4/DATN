import asyncio
from typing import AsyncGenerator

async def stream_blocking_generator(gen_func, *args, loop=None) -> AsyncGenerator[str, None]:
    loop = loop or asyncio.get_running_loop()
    q: asyncio.Queue = asyncio.Queue()
    sentinel = object()

    def _runner():
        try:
            for item in gen_func(*args):
                loop.call_soon_threadsafe(q.put_nowait, item)
        except Exception as e:
            loop.call_soon_threadsafe(q.put_nowait, f"__ERROR__:{e}")
        finally:
            loop.call_soon_threadsafe(q.put_nowait, sentinel)

    t = asyncio.get_running_loop().run_in_executor(None, _runner)

    while True:
        item = await q.get()
        if item is sentinel:
            break
        if isinstance(item, str) and item.startswith("__ERROR__:"):
            raise RuntimeError(item[len("__ERROR__:"):])
        yield item
    