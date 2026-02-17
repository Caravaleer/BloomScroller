from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime, timedelta
import os

API_KEY = os.environ.get('GNEWS_API_KEY')
app = Flask(__name__)

BASE_URL = 'https://gnews.io/api/v4/search'

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/news')
def get_news():
    query = request.args.get('q', 'news')
    date_filter = request.args.get('date', 'all')
    
    params = {
        'q': query,
        'apikey': API_KEY,
        'lang': 'en',
        'max': 10,
        'sortby': 'publishedAt',
        'expand': 'content' # Try to get content snippet
    }

    if date_filter != 'all':
        now_utc = datetime.utcnow()
        if date_filter == 'today':
            start_date = now_utc.replace(hour=0, minute=0, second=0)
            params['from'] = start_date.strftime('%Y-%m-%dT%H:%M:%SZ')
        elif date_filter == 'week':
            start_date = now_utc - timedelta(days=7)
            params['from'] = start_date.strftime('%Y-%m-%dT%H:%M:%SZ')

    try:
        response = requests.get(BASE_URL, params=params)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
