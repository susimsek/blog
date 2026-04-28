package repository

import (
	"strings"
	"time"

	"suaybsimsek.com/blog-api/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
)

func mapAdminContentPostDocument(doc adminContentPostDocument) domain.AdminContentPostRecord {
	topicIDs := make([]string, 0, len(doc.TopicIDs))
	for _, topicID := range doc.TopicIDs {
		resolvedID := strings.TrimSpace(strings.ToLower(topicID))
		if resolvedID == "" {
			continue
		}
		topicIDs = append(topicIDs, resolvedID)
	}

	topicNames := make([]string, 0, len(doc.Topics))
	if len(doc.Topics) > 0 {
		for _, topic := range doc.Topics {
			name := strings.TrimSpace(topic.Name)
			if name == "" {
				continue
			}
			topicNames = append(topicNames, name)
		}
	}

	if len(topicNames) == 0 {
		topicNames = append(topicNames, topicIDs...)
	}

	categoryID := ""
	categoryName := ""
	if doc.Category != nil {
		categoryID = strings.TrimSpace(strings.ToLower(doc.Category.ID))
		categoryName = strings.TrimSpace(doc.Category.Name)
	}

	return domain.AdminContentPostRecord{
		Locale:           strings.TrimSpace(strings.ToLower(doc.Locale)),
		ID:               strings.TrimSpace(strings.ToLower(doc.ID)),
		Title:            strings.TrimSpace(doc.Title),
		Summary:          strings.TrimSpace(doc.Summary),
		Content:          doc.Content,
		ContentMode:      strings.TrimSpace(strings.ToLower(doc.ContentMode)),
		Thumbnail:        strings.TrimSpace(doc.Thumbnail),
		Source:           strings.TrimSpace(strings.ToLower(doc.Source)),
		PublishedAt:      doc.PublishedAt,
		PublishedDate:    strings.TrimSpace(doc.PublishedDate),
		UpdatedDate:      strings.TrimSpace(doc.UpdatedDate),
		CategoryID:       categoryID,
		CategoryName:     categoryName,
		TopicIDs:         topicIDs,
		TopicNames:       topicNames,
		ReadingTimeMin:   doc.ReadingTimeMin,
		Status:           normalizeAdminContentPostStatusValue(doc.Status, doc.ScheduledAt),
		ScheduledAt:      doc.ScheduledAt,
		ContentUpdatedAt: doc.ContentUpdatedAt,
		UpdatedAt:        doc.UpdatedAt,
		RevisionCount:    max(doc.RevisionCount, 0),
		LatestRevisionAt: doc.LatestRevisionAt,
	}
}

func mapAdminContentPostRevisionDocument(doc adminContentPostRevisionDocument) domain.AdminContentPostRevisionRecord {
	topicIDs := make([]string, 0, len(doc.TopicIDs))
	for _, topicID := range doc.TopicIDs {
		resolvedID := strings.TrimSpace(strings.ToLower(topicID))
		if resolvedID == "" {
			continue
		}
		topicIDs = append(topicIDs, resolvedID)
	}

	topicNames := make([]string, 0, len(doc.Topics))
	for _, topic := range doc.Topics {
		name := strings.TrimSpace(topic.Name)
		if name == "" {
			continue
		}
		topicNames = append(topicNames, name)
	}
	if len(topicNames) == 0 {
		topicNames = append(topicNames, topicIDs...)
	}

	categoryID := ""
	categoryName := ""
	if doc.Category != nil {
		categoryID = strings.TrimSpace(strings.ToLower(doc.Category.ID))
		categoryName = strings.TrimSpace(doc.Category.Name)
	}

	return domain.AdminContentPostRevisionRecord{
		ID:               strings.TrimSpace(doc.ID),
		Locale:           strings.TrimSpace(strings.ToLower(doc.Locale)),
		PostID:           strings.TrimSpace(strings.ToLower(doc.PostID)),
		RevisionNumber:   max(doc.RevisionNumber, 0),
		Title:            strings.TrimSpace(doc.Title),
		Summary:          strings.TrimSpace(doc.Summary),
		Content:          doc.Content,
		ContentMode:      strings.TrimSpace(strings.ToLower(doc.ContentMode)),
		Thumbnail:        strings.TrimSpace(doc.Thumbnail),
		Source:           strings.TrimSpace(strings.ToLower(doc.Source)),
		PublishedDate:    strings.TrimSpace(doc.PublishedDate),
		UpdatedDate:      strings.TrimSpace(doc.UpdatedDate),
		CategoryID:       categoryID,
		CategoryName:     categoryName,
		TopicIDs:         topicIDs,
		TopicNames:       topicNames,
		ReadingTimeMin:   doc.ReadingTimeMin,
		Status:           normalizeAdminContentPostStatusValue(doc.Status, doc.ScheduledAt),
		ScheduledAt:      doc.ScheduledAt,
		CreatedAt:        doc.CreatedAt,
		ContentUpdatedAt: doc.ContentUpdatedAt,
		UpdatedAt:        doc.UpdatedAt,
	}
}

func buildAdminContentPostRevisionDocument(
	record domain.AdminContentPostRecord,
	revisionID string,
	revisionNumber int,
	now time.Time,
) adminContentPostRevisionDocument {
	document := adminContentPostRevisionDocument{
		ID:               strings.TrimSpace(revisionID),
		Locale:           strings.TrimSpace(strings.ToLower(record.Locale)),
		PostID:           strings.TrimSpace(strings.ToLower(record.ID)),
		RevisionNumber:   revisionNumber,
		Title:            strings.TrimSpace(record.Title),
		Summary:          strings.TrimSpace(record.Summary),
		Content:          record.Content,
		ContentMode:      strings.TrimSpace(strings.ToLower(record.ContentMode)),
		Thumbnail:        strings.TrimSpace(record.Thumbnail),
		Source:           strings.TrimSpace(strings.ToLower(record.Source)),
		PublishedDate:    strings.TrimSpace(record.PublishedDate),
		UpdatedDate:      strings.TrimSpace(record.UpdatedDate),
		TopicIDs:         append([]string{}, record.TopicIDs...),
		ReadingTimeMin:   record.ReadingTimeMin,
		Status:           normalizeAdminContentPostStatusValue(record.Status, record.ScheduledAt),
		ScheduledAt:      record.ScheduledAt,
		ContentUpdatedAt: record.ContentUpdatedAt,
		UpdatedAt:        record.UpdatedAt,
		CreatedAt:        now.UTC(),
	}

	if strings.TrimSpace(record.CategoryID) != "" || strings.TrimSpace(record.CategoryName) != "" {
		document.Category = &struct {
			ID   string `bson:"id"`
			Name string `bson:"name"`
		}{
			ID:   strings.TrimSpace(strings.ToLower(record.CategoryID)),
			Name: strings.TrimSpace(record.CategoryName),
		}
	}

	if len(record.TopicIDs) > 0 || len(record.TopicNames) > 0 {
		document.Topics = make([]struct {
			ID   string `bson:"id"`
			Name string `bson:"name"`
		}, 0, max(len(record.TopicIDs), len(record.TopicNames)))
		for index, topicID := range record.TopicIDs {
			name := ""
			if index < len(record.TopicNames) {
				name = strings.TrimSpace(record.TopicNames[index])
			}
			document.Topics = append(document.Topics, struct {
				ID   string `bson:"id"`
				Name string `bson:"name"`
			}{
				ID:   strings.TrimSpace(strings.ToLower(topicID)),
				Name: name,
			})
		}
	}

	return document
}

func adminContentCategoryDocumentFromRevision(revision domain.AdminContentPostRevisionRecord) any {
	resolvedID := strings.TrimSpace(strings.ToLower(revision.CategoryID))
	resolvedName := strings.TrimSpace(revision.CategoryName)
	if resolvedID == "" && resolvedName == "" {
		return nil
	}

	return bson.M{
		"id":   resolvedID,
		"name": resolvedName,
	}
}

func adminContentTopicDocumentsFromRevision(revision domain.AdminContentPostRevisionRecord) []bson.M {
	if len(revision.TopicIDs) == 0 {
		return []bson.M{}
	}

	topicValues := make([]bson.M, 0, len(revision.TopicIDs))
	for index, topicID := range revision.TopicIDs {
		resolvedID := strings.TrimSpace(strings.ToLower(topicID))
		if resolvedID == "" {
			continue
		}
		name := ""
		if index < len(revision.TopicNames) {
			name = strings.TrimSpace(revision.TopicNames[index])
		}
		topicValues = append(topicValues, bson.M{
			"id":   resolvedID,
			"name": name,
		})
	}
	return topicValues
}

func normalizeAdminContentPostStatusValue(value string, scheduledAt time.Time) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case domain.AdminContentPostStatusDraft:
		return domain.AdminContentPostStatusDraft
	case domain.AdminContentPostStatusScheduled:
		return domain.AdminContentPostStatusScheduled
	case domain.AdminContentPostStatusPublished:
		return domain.AdminContentPostStatusPublished
	default:
		if !scheduledAt.IsZero() {
			return domain.AdminContentPostStatusScheduled
		}
		return domain.AdminContentPostStatusPublished
	}
}

func zeroTimeToNil(value time.Time) any {
	if value.IsZero() {
		return nil
	}
	return value.UTC()
}

func mapAdminContentPostGroupAggregateDocument(
	doc adminContentPostGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentPostGroupRecord, bool) {
	group := domain.AdminContentPostGroupRecord{
		ID:     strings.TrimSpace(strings.ToLower(doc.ID)),
		Source: strings.TrimSpace(strings.ToLower(doc.Source)),
	}

	for _, variant := range doc.Variants {
		mapped := mapAdminContentPostDocument(variant)
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredPost(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentPostGroupRecord{}, false
	}

	return group, true
}

func mapAdminContentTopicGroupAggregateDocument(
	doc adminContentTopicGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentTopicGroupRecord, bool) {
	group := domain.AdminContentTopicGroupRecord{ID: strings.TrimSpace(strings.ToLower(doc.ID))}

	for _, variant := range doc.Variants {
		mapped := domain.AdminContentTopicRecord{
			Locale:    strings.TrimSpace(strings.ToLower(variant.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(variant.ID)),
			Name:      strings.TrimSpace(variant.Name),
			Color:     strings.TrimSpace(strings.ToLower(variant.Color)),
			Link:      strings.TrimSpace(variant.Link),
			UpdatedAt: variant.UpdatedAt,
		}
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredTopic(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentTopicGroupRecord{}, false
	}

	return group, true
}

func mapAdminContentCategoryGroupAggregateDocument(
	doc adminContentCategoryGroupAggregateDocument,
	preferredLocale string,
) (domain.AdminContentCategoryGroupRecord, bool) {
	group := domain.AdminContentCategoryGroupRecord{ID: strings.TrimSpace(strings.ToLower(doc.ID))}

	for _, variant := range doc.Variants {
		mapped := domain.AdminContentCategoryRecord{
			Locale:    strings.TrimSpace(strings.ToLower(variant.Locale)),
			ID:        strings.TrimSpace(strings.ToLower(variant.ID)),
			Name:      strings.TrimSpace(variant.Name),
			Color:     strings.TrimSpace(strings.ToLower(variant.Color)),
			Icon:      strings.TrimSpace(variant.Icon),
			Link:      strings.TrimSpace(variant.Link),
			UpdatedAt: variant.UpdatedAt,
		}
		switch mapped.Locale {
		case adminContentLocaleEN:
			if group.EN == nil {
				group.EN = &mapped
			}
		case adminContentLocaleTR:
			if group.TR == nil {
				group.TR = &mapped
			}
		}
	}

	assignAdminContentPreferredCategory(&group, preferredLocale)
	if strings.TrimSpace(group.Preferred.ID) == "" {
		return domain.AdminContentCategoryGroupRecord{}, false
	}

	return group, true
}
