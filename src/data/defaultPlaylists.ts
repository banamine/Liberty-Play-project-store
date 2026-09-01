import { Playlist } from '../types';

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'liberty-global-live',
    name: 'Liberty Global Live Streams',
    isCustom: false,
    channels: [
      {
        id: 'nasa-tv',
        name: 'NASA TV HD (Public Live)',
        url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
        group: 'Documentary & Space',
        logo: 'https://www.nasa.gov/sites/default/files/thumbnails/image/nasa-logo-web-rgb.png',
        tvgId: 'NASA',
      },
      {
        id: 'france-24',
        name: 'France 24 English HD',
        url: 'https://static.france24.com/live/F24_EN_HI_HLS/live_web.m3u8',
        group: 'Global News',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/France_24_Logo.svg/512px-France_24_Logo.svg.png',
        tvgId: 'France24',
      },
      {
        id: 'arte-tv',
        name: 'ARTE Kultura & Documentary',
        url: 'https://artelive-lh.akamaihd.net/i/arte_live_de@393591/index_1080p-b.m3u8',
        group: 'Culture & Arts',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Arte_Logo_2016.svg/512px-Arte_Logo_2016.svg.png',
        tvgId: 'ARTE',
      },
      {
        id: 'big-buck-bunny',
        name: 'Big Buck Bunny (Cinema HD)',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        group: 'Movies & Cinema',
        logo: 'https://peach.blender.org/wp-content/uploads/title-2.jpg',
        tvgId: 'BBB',
      },
      {
        id: 'sintel-movie',
        name: 'Sintel 4K Animation Stream',
        url: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
        group: 'Animation & Kids',
        logo: 'https://durian.blender.org/wp-content/uploads/2010/06/sintel_poster_small.jpg',
        tvgId: 'Sintel',
      },
      {
        id: 'tears-of-steel',
        name: 'Tears of Steel Sci-Fi Live',
        url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
        group: 'Sci-Fi & Action',
        logo: 'https://mango.blender.org/wp-content/uploads/2012/12/poster_slider_1.jpg',
        tvgId: 'TOS',
      },
      {
        id: 'red-bull-tv',
        name: 'Red Bull Action Sports',
        url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT-en-hd/master.m3u8',
        group: 'Sports & Extreme',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Red_Bull_Logo.svg/512px-Red_Bull_Logo.svg.png',
        tvgId: 'RedBull',
      },
      {
        id: 'bloomberg-quicktake',
        name: 'Bloomberg TV Finance',
        url: 'https://bloomberg.com/media-manifest/streams/us-fast.m3u8',
        group: 'Business & Finance',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Bloomberg_Logo.svg/512px-Bloomberg_Logo.svg.png',
        tvgId: 'Bloomberg',
      }
    ]
  }
];

export const MOCK_EPG_DATABASE: Record<string, Array<{title: string; desc: string; time: string; duration: number}>> = {
  'nasa-tv': [
    { title: 'ISS Live Earth Views & Operations', desc: 'Real-time high definition views of planet Earth from cameras aboard the International Space Station.', time: '10:00 - 11:30', duration: 90 },
    { title: 'NASA Science Live: Deep Space Probes', desc: 'Exploring recent discoveries made by the James Webb Space Telescope and planetary explorers.', time: '11:30 - 12:45', duration: 75 },
    { title: 'Countdown to Artemis Mission', desc: 'An in-depth documentary showcasing the next generation human spaceflight hardware testing.', time: '12:45 - 14:00', duration: 75 }
  ],
  'france-24': [
    { title: 'Global News Hour & Headines', desc: 'Comprehensive international news coverage with live dispatches from correspondents worldwide.', time: '10:00 - 11:00', duration: 60 },
    { title: 'Business Report: Tech Frontiers', desc: 'Analyzing global economic trends, venture capital movements, and AI semiconductor markets.', time: '11:00 - 11:30', duration: 30 },
    { title: 'Focus on Europe: Cultural Exchange', desc: 'Documentaries and cultural highlights exploring heritage, arts, and innovation across Europe.', time: '11:30 - 12:30', duration: 60 }
  ],
  'big-buck-bunny': [
    { title: 'Big Buck Bunny (Feature Presentation)', desc: 'A large and lovable rabbit deals with bullying forest creatures in this classic open animation.', time: '10:00 - 11:00', duration: 60 },
    { title: 'Making of Blender Open Movies', desc: 'Behind the scenes documentary on open-source 3D animation pipelines and rendering technology.', time: '11:00 - 12:00', duration: 60 }
  ]
};
