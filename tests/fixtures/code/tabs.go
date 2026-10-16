package cache

import "sync"

type Store struct {
	mu    sync.RWMutex
	items map[string]string
}

func (s *Store) Get(key string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.items[key]
	return v, ok
}
