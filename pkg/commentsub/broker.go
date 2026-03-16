package commentsub

import (
	"strings"
	"sync"

	"suaybsimsek.com/blog-api/internal/domain"
)

const brokerBufferSize = 32

type Broker interface {
	Subscribe(postID string) (<-chan domain.CommentEvent, func())
	Publish(event domain.CommentEvent)
}

type inMemoryBroker struct {
	mu          sync.RWMutex
	subscribers map[string]map[chan domain.CommentEvent]struct{}
}

func NewBroker() Broker {
	return &inMemoryBroker{
		subscribers: make(map[string]map[chan domain.CommentEvent]struct{}),
	}
}

func (b *inMemoryBroker) Subscribe(postID string) (<-chan domain.CommentEvent, func()) {
	resolvedPostID := strings.TrimSpace(strings.ToLower(postID))
	channel := make(chan domain.CommentEvent, brokerBufferSize)

	b.mu.Lock()
	if b.subscribers[resolvedPostID] == nil {
		b.subscribers[resolvedPostID] = make(map[chan domain.CommentEvent]struct{})
	}
	b.subscribers[resolvedPostID][channel] = struct{}{}
	b.mu.Unlock()

	return channel, func() {
		b.mu.Lock()
		if subscribers, ok := b.subscribers[resolvedPostID]; ok {
			delete(subscribers, channel)
			if len(subscribers) == 0 {
				delete(b.subscribers, resolvedPostID)
			}
		}
		b.mu.Unlock()
		close(channel)
	}
}

func (b *inMemoryBroker) Publish(event domain.CommentEvent) {
	resolvedPostID := strings.TrimSpace(strings.ToLower(event.PostID))

	b.mu.RLock()
	targets := make([]chan domain.CommentEvent, 0)
	targets = append(targets, b.collectSubscribers(resolvedPostID)...)
	if resolvedPostID != "" {
		targets = append(targets, b.collectSubscribers("")...)
	}
	b.mu.RUnlock()

	for _, target := range targets {
		select {
		case target <- event:
		default:
		}
	}
}

func (b *inMemoryBroker) collectSubscribers(postID string) []chan domain.CommentEvent {
	group := b.subscribers[postID]
	if len(group) == 0 {
		return nil
	}

	targets := make([]chan domain.CommentEvent, 0, len(group))
	for subscriber := range group {
		targets = append(targets, subscriber)
	}
	return targets
}
