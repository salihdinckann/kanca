import os

# Never download threat feeds during tests; tests fill app.feeds.feeds directly.
os.environ["KANCA_FEEDS"] = "0"
