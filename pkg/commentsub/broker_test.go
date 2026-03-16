package commentsub

import (
	"testing"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"
)

func expectEvent(t *testing.T, channel <-chan domain.CommentEvent) domain.CommentEvent {
	t.Helper()

	select {
	case event := <-channel:
		return event
	case <-time.After(250 * time.Millisecond):
		t.Fatal("expected comment event to be delivered")
		return domain.CommentEvent{}
	}
}

func expectNoEvent(t *testing.T, channel <-chan domain.CommentEvent) {
	t.Helper()

	select {
	case event := <-channel:
		t.Fatalf("did not expect comment event: %+v", event)
	case <-time.After(50 * time.Millisecond):
	}
}

func TestInMemoryBrokerPublishesToPostAndGlobalSubscribers(t *testing.T) {
	t.Parallel()

	broker := NewBroker()
	postChannel, unsubscribePost := broker.Subscribe(" Alpha-Post ")
	defer unsubscribePost()
	globalChannel, unsubscribeGlobal := broker.Subscribe("")
	defer unsubscribeGlobal()
	otherChannel, unsubscribeOther := broker.Subscribe("beta-post")
	defer unsubscribeOther()

	event := domain.CommentEvent{
		Type:   domain.CommentEventTypeCreated,
		PostID: "ALPHA-post",
	}

	broker.Publish(event)

	if delivered := expectEvent(t, postChannel); delivered.PostID != "ALPHA-post" {
		t.Fatalf("expected post-scoped subscriber to receive original event, got %+v", delivered)
	}

	if delivered := expectEvent(t, globalChannel); delivered.PostID != "ALPHA-post" {
		t.Fatalf("expected global subscriber to receive original event, got %+v", delivered)
	}

	expectNoEvent(t, otherChannel)
}

func TestInMemoryBrokerUnsubscribeRemovesSubscriber(t *testing.T) {
	t.Parallel()

	broker := NewBroker()
	channel, unsubscribe := broker.Subscribe("alpha-post")
	unsubscribe()

	broker.Publish(domain.CommentEvent{
		Type:   domain.CommentEventTypeDeleted,
		PostID: "alpha-post",
	})

	select {
	case _, ok := <-channel:
		if ok {
			t.Fatal("expected unsubscribed channel to be closed")
		}
	case <-time.After(250 * time.Millisecond):
		t.Fatal("expected unsubscribed channel to close")
	}
}
