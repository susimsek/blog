package mtest

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/x/mongo/driver/drivertest"
	"go.mongodb.org/mongo-driver/v2/x/mongo/driver/xoptions"
)

const FirstBatch = 0

type ClientType int

const Mock ClientType = 1

type Options struct{}

func NewOptions() *Options                      { return &Options{} }
func (*Options) CreateClient(bool) *Options     { return &Options{} }
func (*Options) ClientType(ClientType) *Options { return &Options{} }
func (*Options) DatabaseName(string) *Options   { return &Options{} }
func (*Options) CreateCollection(bool) *Options { return &Options{} }

type T struct {
	*testing.T
	Client     *mongo.Client
	deployment *drivertest.MockDeployment
}

func New(t *testing.T, _ *Options) *T {
	return &T{T: t}
}

func (t *T) RunOpts(name string, _ *Options, run func(*T)) {
	t.Run(name, func(subtest *testing.T) {
		deployment := drivertest.NewMockDeployment()
		clientOptions := options.Client()
		if err := xoptions.SetInternalClientOptions(clientOptions, "deployment", deployment); err != nil {
			subtest.Fatalf("configure mock MongoDB deployment: %v", err)
		}
		client, err := mongo.Connect(clientOptions)
		if err != nil {
			subtest.Fatalf("create mock MongoDB client: %v", err)
		}
		subtest.Cleanup(func() {
			if err := client.Disconnect(context.Background()); err != nil {
				subtest.Errorf("disconnect mock MongoDB client: %v", err)
			}
		})

		run(&T{T: subtest, Client: client, deployment: deployment})
	})
}

func (t *T) AddMockResponses(responses ...bson.D) {
	t.deployment.AddResponses(responses...)
}

func CreateSuccessResponse(elements ...bson.E) bson.D {
	response := bson.D{{Key: "ok", Value: 1}}
	return append(response, elements...)
}

func CreateCursorResponse(cursorID int64, namespace string, _ int, documents ...bson.D) bson.D {
	batch := make(bson.A, len(documents))
	for index, document := range documents {
		batch[index] = document
	}
	return CreateSuccessResponse(bson.E{Key: "cursor", Value: bson.D{
		{Key: "id", Value: cursorID},
		{Key: "ns", Value: namespace},
		{Key: "firstBatch", Value: batch},
	}})
}
