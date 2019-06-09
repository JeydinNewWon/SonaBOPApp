import youtube_dl
import sys

options = {
    "format": "bestaudio/best",
    "ffmpeg_location": "./bin/ffmpeg",
    "extractaudio": True,
    "audioformat": "mp3",
    "default_search": "auto",
    "outtmpl": "~/Desktop/%(title)s.%(ext)s",
    "no_warnings": True,
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }]
}

video_title = sys.argv[1]

def download_video(query):
    youtube_dl.YoutubeDL(options).download(query)


video_title = [video_title]
try:
    download_video(video_title)
except youtube_dl.utils.DownloadError as error:
    print('Error: py\n{}: {}\n'.format(error.__class__.__name__, error))


