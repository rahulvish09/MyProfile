import urllib.request
import re
try:
    req = urllib.request.Request('https://www.ratnamani.com/', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    logos = re.findall(r'<img[^>]+src=["\']([^"\']+logo[^"\']+)["\']', html, re.I)
    print("LOGOS:", logos)
except Exception as e:
    print("ERROR:", e)
