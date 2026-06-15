import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LoadingState } from './LoadingState/LoadingState.jsx';
import './GenrePages.css';
import { API_URL } from '../api.js';

function createSlug(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getImage(genre) {
  return genre?.image || '/assets/img/avatars/avatar.jpg';
}

export function GenresPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadGenres() {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/genres`);
        if (!mounted) return;
        setGenres(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error('Load genres failed:', error);
        if (mounted) {
          setGenres([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadGenres();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="app__container tab--explore active">
      <div className="app__container-content">
        <div className="genre-page explore__container">
          <div className="grid">
            <div className="row no-gutters">
              <div className="col l-12 m-12 c-12">
                <div className="container__header mb-10">
                  <h3 className="container__header-subtitle">Thể Loại</h3>
                </div>
              </div>

              <div className="col l-12 m-12 c-12">
                {loading ? (
                  <LoadingState message="Đang tải thể loại..." />
                ) : genres.length === 0 ? (
                  <div className="box--no-content">
                    <span className="no-content-text">Chưa có thể loại nào</span>
                  </div>
                ) : (
                  <div className="genre-page__grid">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        className="genre-page__card"
                        style={{ backgroundImage: `url(${getImage(genre)})` }}
                        onClick={() => navigate(`/genre/${createSlug(genre.name)}`)}
                      >
                        <span className="genre-page__card-name">{genre.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
