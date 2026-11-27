from functools import wraps


def retries(times: int = 3):
    """Retry a call, then give up and re-raise."""

    def outer(fn):
        @wraps(fn)
        def inner(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return fn(*args, **kwargs)
                except OSError as err:
                    print(f"attempt {attempt} of {times} failed: {err!r}")
            raise RuntimeError(f"{fn.__name__} failed after {times} attempts")

        return inner

    return outer
