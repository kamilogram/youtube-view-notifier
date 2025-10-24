import { YoutubeStats } from '../types';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function fetchChannelStats(channelId: string, apiKey: string): Promise<YoutubeStats> {
    // 1. Pobierz ID playlisty z uploadami
    const channelResponse = await fetch(
        `${YOUTUBE_API_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );
    
    if (!channelResponse.ok) {
        throw new Error('Nie można znaleźć kanału. Sprawdź ID kanału.');
    }

    const channelData = await channelResponse.json();
    if (!channelData.items?.length) {
        throw new Error('Kanał nie istnieje');
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // 2. Pobierz wszystkie filmy z playlisty
    const videosResponse = await fetch(
        `${YOUTUBE_API_URL}/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    );

    if (!videosResponse.ok) {
        throw new Error('Nie można pobrać listy filmów');
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId);

    // 3. Pobierz statystyki dla wszystkich filmów
    const statsResponse = await fetch(
        `${YOUTUBE_API_URL}/videos?part=statistics&id=${videoIds.join(',')}&key=${apiKey}`
    );

    if (!statsResponse.ok) {
        throw new Error('Nie można pobrać statystyk filmów');
    }

    const statsData = await statsResponse.json();
    const totalViews = statsData.items.reduce(
        (sum: number, video: any) => sum + parseInt(video.statistics.viewCount || '0', 10),
        0
    );

    return {
        totalViews,
        videoCount: videoIds.length
    };
}