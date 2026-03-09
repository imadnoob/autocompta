import urllib.request
import re

url = "https://www.youtube.com/playlist?list=PLnaQPXlNDfRoK3fpASgOdQ25cWfY16kiU"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    titles = re.findall(r'\"title\":{\"runs\":\[{\"text\":\"(.*?)\"}\]', html)
    unique_titles = list(dict.fromkeys(titles))
    for i, t in enumerate(unique_titles):
        print(f"{i+1}. {t}")
except Exception as e:
    print(f"Error: {e}")
