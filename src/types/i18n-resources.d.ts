interface Resources {
  "404": {
    "404": {
      "backToHome": "Back to Home",
      "description": "The page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.",
      "errorCode": "404",
      "header": "Oops! Page Not Found",
      "meta": {
        "description": "The page you are looking for does not exist or has been moved."
      },
      "title": "404 - Page Not Found"
    }
  },
  "about": {
    "about": {
      "description": "Hi, I’m Şuayb Şimşek, a passionate backend and fullstack developer from Turkey. I graduated in Computer Engineering from TOBB University of Economics and Technology. Over the past {{experienceYears}} years, I have gained extensive experience in backend, frontend, blockchain, and DevOps technologies.",
      "findMeOnline": "Get in Touch with Me",
      "header": "About Me",
      "jobTitle": "Senior Software Engineer",
      "meta": {
        "description": "Learn more about Şuayb Şimşek, a passionate backend and fullstack developer from Turkey. Explore his experience, education, and online presence.",
        "keywords": "Şuayb Şimşek, backend developer, fullstack developer, blockchain, DevOps",
        "title": "About Me"
      },
      "title": "About Me"
    }
  },
  "admin-account": {
    "adminAccount": {
      "account": {
        "appearance": {
          "copy": "Choose how the admin panel looks for your account on this browser.",
          "options": {
            "dark": "Dark mode",
            "forest": "Forest mode",
            "light": "Light mode",
            "oceanic": "Oceanic mode",
            "system": "System"
          },
          "title": "Appearance"
        },
        "delete": {
          "confirmLabel": "Type confirmation",
          "confirmPlaceholder": "Type {{value}} to confirm",
          "copy": "Permanently disable this admin account. This action cannot be undone.",
          "currentPassword": "Current password",
          "currentPasswordPlaceholder": "Enter your current password",
          "submit": "Delete account",
          "submitting": "Deleting account...",
          "title": "Delete account"
        },
        "email": {
          "copy": "Verify a new email address before it becomes active for your admin account.",
          "currentLabel": "Current email",
          "currentPassword": "Current password",
          "currentPasswordPlaceholder": "Enter your current password",
          "label": "New email",
          "pending": {
            "copy": "Confirmation is waiting for {{email}}.",
            "expiresAt": "Expires: {{value}}",
            "title": "Pending email change"
          },
          "placeholder": "Enter a new email address",
          "submit": "Send verification email",
          "submitting": "Sending verification email...",
          "title": "Change email"
        },
        "errors": {
          "deleteAccount": "Account could not be deleted right now.",
          "emailUpdate": "Email change could not be started right now.",
          "usernameUpdate": "Username could not be updated right now."
        },
        "success": {
          "deleted": "Account deleted. You are being signed out.",
          "emailChangeRequested": "Verification email sent to {{email}}.",
          "usernameUpdated": "Username updated."
        },
        "username": {
          "copy": "Update your username for your admin account.",
          "label": "New username",
          "placeholder": "Enter a new username",
          "submit": "Update username",
          "submitting": "Updating username...",
          "title": "Change username"
        }
      },
      "comments": {
        "actions": {
          "approve": "Approve",
          "delete": "Delete",
          "deleting": "Deleting...",
          "openPost": "Open post",
          "reject": "Reject",
          "spam": "Spam",
          "updating": "Updating..."
        },
        "bulk": {
          "clearSelection": "Clear",
          "deleteConfirmCopy_one": "Delete {{count}} selected comment permanently? This action cannot be undone.",
          "deleteConfirmCopy_other": "Delete {{count}} selected comments permanently? This action cannot be undone.",
          "deleteConfirmTitle": "Delete selected comments",
          "selectAll": "Select page",
          "selected_one": "{{count}} selected",
          "selected_other": "{{count}} selected"
        },
        "copy": "Filter guest comments, review replies, and publish or block them with the same workflow used across admin settings.",
        "deleteConfirm": {
          "copy": "Delete this comment by {{author}} permanently? This action cannot be undone.",
          "labels": {
            "author": "Author",
            "email": "Email",
            "post": "Post"
          },
          "title": "Delete comment"
        },
        "empty": "No comments found for the current filter.",
        "errors": {
          "bulkDelete": "Selected comments could not be deleted.",
          "bulkDeletePartial": "Some selected comments could not be deleted.",
          "bulkStatusUpdate": "Selected comments could not be updated.",
          "bulkStatusUpdatePartial": "Some selected comments could not be updated.",
          "delete": "Comment could not be deleted.",
          "load": "Comments could not be loaded.",
          "statusUpdate": "Comment status could not be updated."
        },
        "filters": {
          "locale": "Locale",
          "locales": {
            "all": "All locales",
            "en": "English",
            "tr": "Turkish"
          },
          "query": "Search",
          "queryPlaceholder": "Search by author, email, post, or content",
          "status": "Status",
          "statuses": {
            "all": "All statuses",
            "approved": "Approved",
            "pending": "Pending",
            "rejected": "Rejected",
            "spam": "Spam"
          }
        },
        "list": {
          "post": "Post: {{title}}",
          "replyLabel": "Reply",
          "rootLabel": "Root comment",
          "submittedAt": "Submitted: {{value}}",
          "updatedAt": "Updated: {{value}}"
        },
        "loading": "Loading comments...",
        "success": {
          "approved": "Comment approved: {{author}}",
          "bulkApproved_one": "{{count}} comment approved.",
          "bulkApproved_other": "{{count}} comments approved.",
          "bulkDeleted_one": "{{count}} comment deleted.",
          "bulkDeleted_other": "{{count}} comments deleted.",
          "bulkRejected_one": "{{count}} comment rejected.",
          "bulkRejected_other": "{{count}} comments rejected.",
          "bulkSpam_one": "{{count}} comment marked as spam.",
          "bulkSpam_other": "{{count}} comments marked as spam.",
          "deleted": "Comment deleted: {{author}}",
          "rejected": "Comment rejected: {{author}}",
          "spam": "Comment marked as spam: {{author}}"
        },
        "title": "Comment moderation"
      },
      "connectedAccounts": {
        "actions": {
          "hide": "Hide",
          "manage": "Manage"
        },
        "copy": "Manage how you sign in to the admin panel from one place.",
        "github": {
          "connect": "Connect GitHub",
          "connectedBadge": "Connected",
          "connectedCopy": "Connected as {{email}}.",
          "connecting": "Connecting...",
          "disconnect": "Disconnect GitHub",
          "disconnectConfirmCopy": "Disconnect {{email}} from this admin account.",
          "disconnectConfirmTitle": "Disconnect GitHub account",
          "disconnectedCopy": "Link a GitHub account first. After that, Continue with GitHub appears on the login screen.",
          "disconnecting": "Disconnecting...",
          "linkedAt": "Linked: {{value}}",
          "loginEnabled": "GitHub sign-in is now available on the admin login screen.",
          "messages": {
            "cancelled": "GitHub connection was cancelled.",
            "conflict": "This GitHub account is already linked to another admin user.",
            "connected": "GitHub account connected.",
            "disconnected": "GitHub account disconnected.",
            "failed": "GitHub connection could not be completed right now.",
            "notLinked": "This GitHub account is not linked to an admin user."
          },
          "title": "GitHub",
          "unavailableBadge": "Unavailable"
        },
        "google": {
          "connect": "Connect Google",
          "connectConfirmCopy": "Link a Google account to this admin user.",
          "connectConfirmTitle": "Connect Google account",
          "connectedBadge": "Connected",
          "connectedCopy": "Connected as {{email}}.",
          "connecting": "Connecting...",
          "disconnect": "Disconnect Google",
          "disconnectConfirmCopy": "Disconnect {{email}} from this admin account.",
          "disconnectConfirmTitle": "Disconnect Google account",
          "disconnectedCopy": "Link a Google account first. After that, Continue with Google appears on the login screen.",
          "disconnecting": "Disconnecting...",
          "linkedAt": "Linked: {{value}}",
          "loginEnabled": "Google sign-in is now available on the admin login screen.",
          "messages": {
            "cancelled": "Google connection was cancelled.",
            "conflict": "This Google account is already linked to another admin user.",
            "connected": "Google account connected.",
            "disconnected": "Google account disconnected.",
            "failed": "Google connection could not be completed right now.",
            "notLinked": "This Google account is not linked to an admin user."
          },
          "title": "Google",
          "unavailableBadge": "Unavailable"
        },
        "password": {
          "action": "Change password",
          "copy": "Use your password to sign in to the admin panel."
        },
        "title": "Sign-in methods"
      },
      "content": {
        "actions": {
          "backToPosts": "Back to posts",
          "create": "Create",
          "createCategory": "Create category",
          "createTopic": "Create topic",
          "delete": "Delete",
          "deletePost": "Delete post",
          "deleting": "Deleting...",
          "saving": "Saving...",
          "update": "Update",
          "updatePost": "Update post",
          "updatePostContent": "Save content",
          "updating": "Updating..."
        },
        "categories": {
          "title": "Categories"
        },
        "copy": "List posts, filter by locale/topic/category, update metadata, and manage topic/category taxonomies.",
        "empty": {
          "categories": "No categories found.",
          "posts": "No posts found for the current filters.",
          "topics": "No topics found."
        },
        "errors": {
          "categoryCreate": "Category could not be created.",
          "categoryDelete": "Category could not be deleted.",
          "categoryUpdate": "Category could not be updated.",
          "mediaLibraryCopy": "Media path could not be copied.",
          "mediaLibraryDelete": "Media asset could not be deleted.",
          "mediaLibraryLoad": "Media library could not be loaded.",
          "mediaLibraryReplace": "Image could not be replaced.",
          "mediaLibraryUpload": "Image could not be uploaded.",
          "postContentUpdate": "Post content could not be updated.",
          "postDelete": "Post could not be deleted.",
          "postLoad": "Posts could not be loaded.",
          "postRevisionRestore": "Post revision could not be restored.",
          "postRevisionsLoad": "Post revisions could not be loaded.",
          "postUpdate": "Post metadata could not be updated.",
          "taxonomyLoad": "Topics and categories could not be loaded.",
          "topicCreate": "Topic could not be created.",
          "topicDelete": "Topic could not be deleted.",
          "topicUpdate": "Topic could not be updated."
        },
        "filters": {
          "categories": {
            "all": "All categories"
          },
          "category": "Category",
          "locale": "Locale",
          "locales": {
            "all": "All locales",
            "en": "English",
            "tr": "Turkish"
          },
          "query": "Search",
          "queryPlaceholder": "Search by id or title",
          "source": "Source",
          "sources": {
            "all": "All sources"
          },
          "topic": "Topic",
          "topics": {
            "all": "All topics"
          }
        },
        "list": {
          "colorValue": "Color: {{value}}",
          "iconValue": "Icon: {{value}}",
          "localeValue": "Locale: {{value}}",
          "updatedAt": "Updated: {{value}}"
        },
        "loading": {
          "postContent": "Loading post content...",
          "posts": "Loading posts...",
          "taxonomy": "Loading taxonomy..."
        },
        "media": {
          "actions": {
            "copied": "Copied",
            "copy": "Copy path",
            "delete": "Delete asset",
            "open": "Open",
            "replace": "Replace image"
          },
          "copy": "Upload images, review reusable thumbnails, and copy media paths for content metadata.",
          "deleteConfirm": {
            "copy": "Delete {{name}} permanently? This action cannot be undone.",
            "inUse_one": "This image is still used in {{count}} post. Remove it from post metadata before deleting the asset.",
            "inUse_other": "This image is still used in {{count}} posts. Remove it from post metadata before deleting the asset.",
            "labels": {
              "path": "Path",
              "usage": "Usage"
            },
            "title": "Delete media asset"
          },
          "loading": "Loading media library...",
          "title": "Media library"
        },
        "modals": {
          "category": {
            "color": "Color",
            "createTitle": "Create category",
            "icon": "Icon",
            "id": "Category id",
            "link": "Link",
            "locale": "Locale",
            "name": "Name",
            "updateTitle": "Update category"
          },
          "deleteCategory": {
            "copy": "Delete category {{id}}?",
            "title": "Delete category"
          },
          "deletePost": {
            "copy": "Delete post {{id}}?",
            "title": "Delete post"
          },
          "deleteTopic": {
            "copy": "Delete topic {{id}}?",
            "title": "Delete topic"
          },
          "post": {
            "analytics": {
              "comments": "Comments",
              "copy": "Review the current engagement summary for this post before editing its metadata.",
              "likes": "Likes",
              "title": "Performance snapshot",
              "views": "Views"
            },
            "category": "Category",
            "categoryNone": "No category",
            "comments": {
              "copy": "Review and moderate the discussion attached to this post without leaving the editor.",
              "empty": "No comments found for this post and filter.",
              "queryPlaceholder": "Search by author, email, or content",
              "title": "Post comments",
              "total_one": "{{count}} comment",
              "total_other": "{{count}} comments"
            },
            "contentHint": "Supports standard Markdown syntax.",
            "contentLabel": "Markdown content",
            "empty": "No post selected.",
            "labels": {
              "id": "Post id: {{value}}",
              "locale": "Locale: {{value}}"
            },
            "lifecycle": {
              "latestRevisionAt": "Latest revision: {{value}}",
              "revisionSummary_one": "{{count}} saved revision",
              "revisionSummary_other": "{{count}} saved revisions",
              "scheduledAtDisabledHint": "Set status to Scheduled to plan a future publish time.",
              "scheduledAtHint": "Pick a future date and time for scheduled publishing.",
              "scheduledAtLabel": "Scheduled publish time",
              "scheduledFor": "Scheduled for: {{value}}",
              "statusHint": "Choose whether the post stays in draft, publishes on a schedule, or is live now.",
              "statusLabel": "Publishing status",
              "statuses": {
                "draft": "Draft",
                "published": "Published",
                "scheduled": "Scheduled"
              }
            },
            "media": {
              "badges": {
                "reused": "Reused",
                "uploaded": "Uploaded"
              },
              "clear": "Clear",
              "clearSearch": "Clear media search",
              "empty": "No media found for the current search.",
              "filterLabel": "Source",
              "filters": {
                "all": "All media",
                "reused": "Reused",
                "uploaded": "Uploaded"
              },
              "hint": "Open the media library to upload images or copy a reusable thumbnail path.",
              "openLibrary": "Open media library",
              "queryPlaceholder": "Search media by name or title",
              "select": "Use image",
              "selected": "Selected",
              "sortLabel": "Sort",
              "sorts": {
                "name": "Name",
                "recent": "Most recent",
                "size": "File size",
                "usage": "Usage"
              },
              "title": "Media library",
              "upload": "Upload image",
              "uploadLabel": "Upload",
              "usedIn_one": "Used in {{count}} post",
              "usedIn_other": "Used in {{count}} posts"
            },
            "meta": {
              "published": "Published",
              "updated": "Updated"
            },
            "metadataFields": {
              "publishedDate": "Published date",
              "summary": "Description",
              "thumbnail": "Thumbnail",
              "title": "Title",
              "updatedDate": "Updated date",
              "updatedDateHint": "Leave empty to clear updated date."
            },
            "modes": {
              "editor": "Editor",
              "preview": "Preview",
              "split": "Editor + Preview"
            },
            "previewEmpty": "No content to preview.",
            "previewTitle": "Preview",
            "revisions": {
              "copy": "Restore a previous saved version of this post if a metadata or content update needs to be rolled back.",
              "createdAt": "Saved: {{value}}",
              "empty": "No revisions have been saved for this post yet.",
              "loading": "Loading post revisions...",
              "publishedDate": "Published: {{value}}",
              "restore": "Restore revision",
              "restoreCopy": "Restore revision #{{revision}}? The current post state will be saved as a new revision before restore completes.",
              "restoreLabels": {
                "createdAt": "Saved at",
                "status": "Status",
                "title": "Title"
              },
              "restoreTitle": "Restore revision",
              "restoring": "Restoring...",
              "revisionBadge": "Revision #{{revision}}",
              "scheduledAt": "Scheduled: {{value}}",
              "title": "Revision history",
              "updatedDate": "Updated: {{value}}"
            },
            "seo": {
              "authorLabel": "Author",
              "canonicalLabel": "Canonical",
              "copy": "Preview how this post will appear in social cards before publishing metadata changes.",
              "creatorLabel": "Creator",
              "openGraphTitle": "Open Graph preview",
              "placeholderDescription": "Add a description to preview social cards.",
              "placeholderTitle": "Untitled post",
              "title": "SEO & social preview",
              "twitterTitle": "X preview"
            },
            "tabs": {
              "comments": "Comments",
              "content": "Content",
              "metadata": "Metadata"
            },
            "title": "Update post metadata",
            "topics": "Topics",
            "topicsEmpty": "No topics found for this locale.",
            "topicsQueryPlaceholder": "Search topics by name"
          },
          "topic": {
            "color": "Color",
            "createTitle": "Create topic",
            "id": "Topic id",
            "link": "Link",
            "locale": "Locale",
            "name": "Name",
            "updateTitle": "Update topic"
          }
        },
        "success": {
          "categoryCreated": "Category created: {{id}}",
          "categoryDeleted": "Category deleted: {{id}}",
          "categoryUpdated": "Category updated: {{id}}",
          "mediaCopied": "Path copied: {{name}}",
          "mediaDeleted": "Image deleted: {{name}}",
          "mediaReplaced": "Image replaced: {{name}}",
          "mediaUploaded": "Image uploaded: {{name}}",
          "postContentUpdated": "Post content updated: {{id}}",
          "postDeleted": "Post deleted: {{id}}",
          "postRevisionRestored": "Revision #{{revision}} restored.",
          "postUpdated": "Post metadata updated: {{id}}",
          "topicCreated": "Topic created: {{id}}",
          "topicDeleted": "Topic deleted: {{id}}",
          "topicUpdated": "Topic updated: {{id}}"
        },
        "tabs": {
          "categories": "Categories",
          "media": "Media",
          "posts": "Posts",
          "topics": "Topics"
        },
        "title": "Content management",
        "topics": {
          "title": "Topics"
        },
        "validation": {
          "id": "Use lowercase letters, numbers, and dash only (2-128 chars)."
        }
      },
      "errorFallback": "Password change failed. Check your inputs and try again.",
      "errorsCatalog": {
        "actions": {
          "confirmDelete": "Delete {{code}} ({{locale}})?",
          "create": "Create",
          "creating": "Creating...",
          "delete": "Delete",
          "deleting": "Deleting...",
          "refresh": "Refresh",
          "update": "Update",
          "updating": "Updating..."
        },
        "audit": {
          "actions": {
            "created": "Created",
            "deleted": "Deleted",
            "updated": "Updated"
          },
          "columns": {
            "action": "Action",
            "actor": "Actor",
            "code": "Code",
            "createdAt": "Created at",
            "status": "Status"
          },
          "copy": "Every create, update, and delete action is recorded.",
          "empty": "No audit events found.",
          "errors": {
            "load": "Audit log could not be loaded."
          },
          "loading": "Loading audit log...",
          "statuses": {
            "failed": "Failed",
            "success": "Success"
          },
          "title": "Audit log"
        },
        "copy": "List, filter, create, update, and delete admin API error messages.",
        "create": {
          "code": "Code",
          "codePlaceholder": "Example: INVALID_CREDENTIALS",
          "codeValidation": "Use only uppercase letters, numbers, and underscore (2-120 chars).",
          "copy": "Add a new localized message by code.",
          "locale": "Locale",
          "message": "Message",
          "messageHint": "Maximum {{count}} characters."
        },
        "deleteConfirm": {
          "title": "Delete error message"
        },
        "empty": "No error messages found for the current filter.",
        "errors": {
          "create": "Error message could not be created.",
          "delete": "Error message could not be deleted.",
          "load": "Error messages could not be loaded.",
          "update": "Error message could not be updated."
        },
        "filters": {
          "locale": "Locale",
          "locales": {
            "all": "All locales",
            "en": "English",
            "tr": "Turkish"
          },
          "query": "Search",
          "queryPlaceholder": "Search by code or message"
        },
        "list": {
          "updatedAt": "Updated: {{value}}"
        },
        "loading": "Loading error messages...",
        "success": {
          "created": "Error message created.",
          "deleted": "Error message deleted.",
          "updated": "Error message updated."
        },
        "tabs": {
          "create": "Create",
          "update": "Update"
        },
        "title": "Error messages",
        "update": {
          "copy": "Edit or delete the currently selected message.",
          "empty": "Select an error message to edit.",
          "labels": {
            "code": "Code",
            "locale": "Locale",
            "scope": "Scope",
            "updatedAt": "Updated at"
          },
          "message": "Message",
          "messageHint": "Maximum {{count}} characters.",
          "notAvailable": "Not available"
        }
      },
      "eyebrow": "Password security",
      "form": {
        "confirmPassword": "Confirm new password",
        "confirmPasswordPlaceholder": "Repeat your new password",
        "copy": "Changing your password revokes existing refresh sessions and sends you back to login.",
        "currentPassword": "Current password",
        "currentPasswordPlaceholder": "Enter your current password",
        "hidePassword": "Hide password",
        "newPassword": "New password",
        "newPasswordPlaceholder": "Create a new password",
        "passwordHint": "Use at least {{count}} characters.",
        "showPassword": "Show password",
        "submit": "Update password",
        "submitting": "Updating password..."
      },
      "meta": {
        "description": "Manage your admin security settings, sessions, and password.",
        "title": "Settings"
      },
      "newsletter": {
        "actions": {
          "delete": "Delete",
          "deleting": "Deleting...",
          "setActive": "Set active",
          "unsubscribe": "Unsubscribe",
          "update": "Update",
          "updating": "Updating..."
        },
        "campaigns": {
          "actions": {
            "openPost": "Open post",
            "sendTest": "Send test",
            "viewFailures": "View failures"
          },
          "copy": "Latest newsletter runs and delivery outcomes.",
          "empty": "No newsletter campaigns found for the current filter.",
          "loading": "Loading newsletter campaigns...",
          "metrics": {
            "failed": "Failed: {{count}}",
            "lastRunAt": "Last run: {{value}}",
            "sent": "Sent: {{count}}"
          },
          "statuses": {
            "partial": "Partial failure",
            "processing": "Processing",
            "sent": "Sent"
          },
          "title": "Recent campaigns"
        },
        "copy": "Run newsletter dispatches, inspect delivery health, and manage subscribers.",
        "deleteConfirm": {
          "copy": "Delete newsletter subscriber {{email}}?",
          "title": "Delete subscriber"
        },
        "empty": "No newsletter subscribers found for the current filter.",
        "errors": {
          "campaigns": "Newsletter campaigns could not be loaded.",
          "delete": "Subscriber could not be deleted.",
          "dispatch": "Newsletter dispatch could not be started.",
          "failures": "Newsletter failures could not be loaded.",
          "load": "Newsletter subscribers could not be loaded.",
          "statusUpdate": "Subscriber status could not be updated.",
          "summary": "Newsletter subscriber summary could not be loaded.",
          "testSend": "Test newsletter email could not be sent."
        },
        "failures": {
          "copy": "Failed recipients for {{title}}.",
          "empty": "No failed deliveries found for this campaign.",
          "lastAttemptAt": "Last attempt: {{value}}",
          "loading": "Loading failed deliveries...",
          "title": "Failed deliveries",
          "total": "Total failed recipients: {{count}}"
        },
        "filters": {
          "locale": "Locale",
          "locales": {
            "all": "All locales",
            "en": "English",
            "tr": "Turkish"
          },
          "query": "Search",
          "queryPlaceholder": "Search by email",
          "status": "Status",
          "statuses": {
            "active": "Active",
            "all": "All statuses",
            "pending": "Pending",
            "unsubscribed": "Unsubscribed"
          }
        },
        "list": {
          "meta": "Source: {{source}} · Form: {{formName}} · Tags: {{tags}}",
          "updatedAt": "Updated: {{value}}"
        },
        "loading": "Loading newsletter subscribers...",
        "operations": {
          "copy": "Run the newsletter job manually. Existing failed recipients are retried on the next dispatch.",
          "justNow": "just now",
          "lastRun": "Last dispatch: {{value}}",
          "result": {
            "completed": "Completed",
            "meta": "Locale: {{locale}} · Sent: {{sent}} · Failed: {{failed}}",
            "skipped": "Skipped"
          },
          "running": "Running dispatch...",
          "title": "Dispatch operations",
          "trigger": "Run dispatch"
        },
        "subscribers": {
          "copy": "Filter subscribers, update subscription status, and remove subscribers.",
          "title": "Subscribers"
        },
        "success": {
          "deleted": "Subscriber deleted: {{email}}",
          "dispatchTriggered": "Newsletter dispatch completed.",
          "statusUpdated": "Subscriber updated: {{email}}",
          "testSend": "Test email sent to {{email}}."
        },
        "summary": {
          "copy": "A quick snapshot of newsletter audience health.",
          "loading": "Loading subscriber summary...",
          "metrics": {
            "active": "Active",
            "pending": "Pending",
            "total": "Total",
            "unsubscribed": "Unsubscribed"
          },
          "title": "Subscriber summary"
        },
        "tabs": {
          "overview": "Overview",
          "subscribers": "Subscribers"
        },
        "testSend": {
          "copy": "Send a single test newsletter email for {{title}}.",
          "emailLabel": "Recipient email",
          "emailPlaceholder": "name@example.com",
          "sending": "Sending test email...",
          "submit": "Send test email",
          "title": "Send test email"
        },
        "title": "Newsletter management"
      },
      "profile": {
        "avatar": {
          "copy": "Upload a PNG, JPEG, or WebP image up to {{sizeMB}}MB.",
          "crop": {
            "cancel": "Cancel",
            "copy": "Drag the photo and use corner handles to adjust the crop.",
            "save": "Set new profile picture",
            "saving": "Saving...",
            "title": "Crop your new profile picture",
            "zoom": "Zoom"
          },
          "edit": "Edit picture",
          "errors": {
            "invalidFormat": "Use PNG, JPEG, or WebP image.",
            "invalidImage": "Selected file is not a valid image.",
            "invalidSize": "Use an image up to {{sizeMB}}MB.",
            "update": "Profile picture could not be updated right now."
          },
          "remove": "Remove picture",
          "states": {
            "custom": "Custom image",
            "default": "Default image"
          },
          "success": {
            "updated": "Profile picture updated."
          },
          "title": "Profile picture",
          "uploading": "Uploading..."
        },
        "copy": "Review your admin identity and account metadata.",
        "errors": {
          "nameUpdate": "Name could not be updated right now."
        },
        "labels": {
          "email": "Email",
          "id": "Account ID",
          "name": "Name",
          "picture": "Profile picture",
          "role": "Role",
          "username": "Username"
        },
        "name": {
          "label": "Name",
          "placeholder": "Enter your name",
          "submit": "Update name",
          "submitting": "Updating name..."
        },
        "notSet": "Not set",
        "success": {
          "nameUpdated": "Name updated."
        },
        "title": "Profile"
      },
      "sessions": {
        "actions": {
          "revokeAll": "Revoke all",
          "revokeSingle_current": "Sign out this device",
          "revokeSingle_other": "Revoke",
          "revokingAll": "Revoking...",
          "revokingSingle": "Revoking..."
        },
        "copy": "Review signed-in devices and revoke sessions you no longer trust.",
        "empty": "No active sessions found.",
        "errors": {
          "load": "Active sessions could not be loaded right now.",
          "revokeAll": "Sessions could not be revoked.",
          "revokeSingle": "Session could not be revoked."
        },
        "labels": {
          "country": "Seen in {{value}}",
          "current": "Current",
          "expires": "Expires: {{value}}",
          "ip": "IP: {{value}}",
          "lastActivity": "Last activity: {{value}}",
          "remembered": "Remembered"
        },
        "loading": "Loading active sessions...",
        "success": {
          "revokeSingle": "Session revoked."
        },
        "title": "Active sessions"
      },
      "settings": {
        "account": "Account",
        "appearance": "Appearance",
        "comments": "Comments",
        "content": "Content",
        "copy": "Manage your profile, account controls, appearance, active sessions, newsletter, comment moderation, and content metadata.",
        "email": "Email",
        "errors": "Error messages",
        "navLabel": "Settings navigation",
        "newsletter": "Newsletter",
        "newsletterSubscribers": "Subscribers",
        "profile": "Profile",
        "security": "Security",
        "sessions": "Sessions",
        "title": "Settings"
      },
      "strength": {
        "excellent": "Excellent",
        "fair": "Fair",
        "good": "Good",
        "idle": "Not set",
        "strong": "Strong",
        "title": "Password strength",
        "weak": "Weak"
      },
      "subtitle": "Update your admin password and sign back in with the new credentials.",
      "success": "Password updated. Sign in again with your new password.",
      "tabs": {
        "password": "Change password",
        "sessions": "Active sessions"
      },
      "title": "Change password",
      "validation": {
        "confirmPasswordMismatch": "Password confirmation does not match.",
        "confirmPasswordRequired": "Confirm your new password.",
        "currentPasswordRequired": "Enter your current password.",
        "deleteConfirmation": "Type {{value}} to confirm account deletion.",
        "emailDifferent": "Use an email different from the current one.",
        "emailInvalid": "Enter a valid email address.",
        "emailRequired": "Enter a new email address.",
        "nameLength": "Name must be between {{min}} and {{max}} characters.",
        "nameRequired": "Enter a name.",
        "newPasswordDifferent": "Choose a password different from the current one.",
        "newPasswordMin": "Use at least {{count}} characters.",
        "newPasswordRequired": "Enter a new password.",
        "usernameDifferent": "Choose a username different from the current one.",
        "usernameLength": "Username must be between {{min}} and {{max}} characters.",
        "usernamePattern": "Use letters, numbers, dot, underscore, or dash only.",
        "usernameRequired": "Enter a username."
      }
    }
  },
  "admin-common": {
    "adminCommon": {
      "actions": {
        "cancel": "Cancel",
        "changePassword": "Password",
        "logout": "Logout",
        "settings": "Settings",
        "toggleSidebar": "Toggle sidebar"
      },
      "brand": "Blog Admin",
      "errors": {
        "network": "Unable to connect to admin service. Check your connection and try again."
      },
      "nav": {
        "account": "Account",
        "dashboard": "Dashboard",
        "login": "Login",
        "site": "Site"
      },
      "status": {
        "loading": "Loading admin session..."
      },
      "title": "Admin",
      "user": {
        "label": "Admin"
      }
    }
  },
  "admin-dashboard": {
    "adminDashboard": {
      "analytics": {
        "subtitle": "A quick read on the posts currently carrying the strongest visibility.",
        "title": "Traffic momentum"
      },
      "cards": {
        "identity": {
          "body": "Signed in as {{email}}.",
          "title": "Identity"
        },
        "posts": {
          "title": "Posts"
        },
        "session": {
          "body": "Authenticated via admin GraphQL and HttpOnly JWT cookie.",
          "title": "Session"
        },
        "subscribers": {
          "title": "Subscribers"
        }
      },
      "comments": {
        "actions": {
          "approve": "Approve",
          "reject": "Reject",
          "spam": "Spam"
        },
        "empty": "No pending comments right now.",
        "loading": "Loading pending comments...",
        "manage": "Manage all comments",
        "subtitle": "Newest guest comments waiting for review.",
        "title": "Comment moderation"
      },
      "contentHealth": {
        "localePairs": "Locale pair coverage",
        "missingThumbnails": "Missing thumbnails",
        "missingTranslations": "Missing translations",
        "subtitle": "Translation parity, media coverage, and recently updated posts.",
        "title": "Content health"
      },
      "curation": {
        "bestFeedback": "Best feedback",
        "dominantCategory": "Dominant category",
        "leadStory": "Lead story",
        "subtitle": "What should lead the homepage and what deserves extra amplification.",
        "title": "Editorial curation"
      },
      "details": {
        "email": "Email",
        "role": "Role",
        "session": "Session"
      },
      "hero": {
        "badge": "Secure session"
      },
      "lists": {
        "topLiked": "Top liked posts",
        "topLikedHint": "Posts with the strongest reader feedback right now.",
        "topViewed": "Top viewed posts",
        "topViewedHint": "Posts currently pulling the most traffic across locales."
      },
      "meta": {
        "description": "Overview of the blog admin panel.",
        "title": "Admin dashboard"
      },
      "sidebar": {
        "analytics": "Analytics",
        "contentHealth": "Content health",
        "copy": "Operations, performance, and editorial signals in one place.",
        "curation": "Curation",
        "label": "Dashboard sections",
        "overview": "Overview"
      },
      "subtitle": "Admin access is active. More operational modules will be added here next.",
      "table": {
        "locale": "Locale",
        "metricHits": "Hits",
        "metricLikes": "Likes",
        "post": "Post"
      },
      "title": "Dashboard",
      "unauthorized": "Your admin session is missing or expired."
    }
  },
  "admin-email-change": {
    "adminEmailChange": {
      "actions": {
        "backToLogin": "Back to login"
      },
      "errors": {
        "network": "Network request failed. Try again."
      },
      "eyebrow": "Admin security",
      "loading": "Confirming admin email change",
      "meta": {
        "description": "Confirm the new email address for your admin account.",
        "title": "Confirm admin email change"
      },
      "status": {
        "expired": {
          "message": "Start the email change request again from the admin panel.",
          "title": "This confirmation link has expired"
        },
        "failed": {
          "message": "Try the email change request again from the admin panel.",
          "title": "The email address could not be changed"
        },
        "invalid-link": {
          "message": "The email change link is missing or invalid.",
          "title": "This confirmation link is invalid"
        },
        "service-unavailable": {
          "message": "Please try again in a few minutes.",
          "title": "The confirmation service is temporarily unavailable"
        },
        "success": {
          "message": "The new admin email address is now active. Sign in again to continue.",
          "title": "Your admin email is confirmed"
        }
      },
      "subtitle": "Review the result of your admin email change confirmation before signing in again.",
      "title": "Confirm admin email change"
    }
  },
  "admin-login": {
    "adminLogin": {
      "email": "Email",
      "emailPlaceholder": "you@example.com",
      "errorFallback": "Login failed. Check your credentials and admin configuration.",
      "eyebrow": "Secure access",
      "forgotPassword": "Forgot password?",
      "github": {
        "cancelled": "GitHub sign-in was cancelled.",
        "failed": "GitHub sign-in could not be completed right now.",
        "notLinked": "This GitHub account is not linked to an admin user.",
        "submit": "Continue with GitHub"
      },
      "google": {
        "cancelled": "Google sign-in was cancelled.",
        "failed": "Google sign-in could not be completed right now.",
        "notLinked": "This Google account is not linked to an admin user.",
        "or": "or",
        "submit": "Continue with Google"
      },
      "help": "Your session is kept in secure cookies. If access expires, sign in again.",
      "hidePassword": "Hide password",
      "meta": {
        "description": "Authenticate to access the blog admin panel.",
        "title": "Admin login"
      },
      "password": "Password",
      "passwordPlaceholder": "Enter your password",
      "rememberMe": "Remember me",
      "showPassword": "Show password",
      "submit": "Sign in",
      "submitting": "Signing in...",
      "subtitle": "Sign in with your configured admin credentials.",
      "title": "Admin login",
      "validation": {
        "emailInvalid": "Enter a valid email address.",
        "emailRequired": "Enter your email address.",
        "passwordRequired": "Enter your password."
      }
    }
  },
  "admin-password-reset": {
    "adminPasswordReset": {
      "errors": {
        "codes": {
          "ADMIN_PASSWORD_RESET_CONFIRM_MISMATCH": "Password confirmation does not match.",
          "ADMIN_PASSWORD_RESET_EMAIL_INVALID": "Enter a valid email address.",
          "ADMIN_PASSWORD_RESET_PASSWORD_REQUIRED": "Enter a new password.",
          "ADMIN_PASSWORD_RESET_PASSWORD_TOO_SHORT": "Use at least 8 characters.",
          "ADMIN_PASSWORD_RESET_TOKEN_EXPIRED": "This password reset link has expired.",
          "ADMIN_PASSWORD_RESET_TOKEN_INVALID": "This password reset link is invalid.",
          "ADMIN_PASSWORD_RESET_TOKEN_REQUIRED": "Password reset link is required."
        },
        "network": "Network request failed. Try again."
      },
      "request": {
        "backToLogin": "Back to login",
        "email": "Email",
        "emailPlaceholder": "you@example.com",
        "eyebrow": "Admin recovery",
        "help": "For security, this page always returns the same result whether the email exists or not.",
        "meta": {
          "description": "Request an admin password reset link.",
          "title": "Forgot admin password"
        },
        "submit": "Send reset link",
        "submitting": "Sending reset link...",
        "subtitle": "Enter your admin email address and we will send a reset link if the account exists.",
        "success": "If that admin email exists, a password reset link has been sent.",
        "title": "Reset admin password",
        "validation": {
          "emailInvalid": "Enter a valid email address.",
          "emailRequired": "Enter your email address."
        }
      },
      "reset": {
        "backToLogin": "Back to login",
        "confirmPassword": "Confirm password",
        "confirmPasswordPlaceholder": "Repeat your new password",
        "expired": "This password reset link has expired. Request a new one.",
        "eyebrow": "Admin recovery",
        "hideConfirmPassword": "Hide password confirmation",
        "hidePassword": "Hide password",
        "invalid": "This password reset link is invalid.",
        "loading": "Checking password reset link",
        "meta": {
          "description": "Set a new password for your admin account.",
          "title": "Choose a new admin password"
        },
        "password": "New password",
        "passwordPlaceholder": "Enter a new password",
        "requestAnother": "Request another link",
        "showConfirmPassword": "Show password confirmation",
        "showPassword": "Show password",
        "submit": "Update password",
        "submitting": "Updating password...",
        "subtitle": "Use a strong password you have not used for this admin account before.",
        "success": "Your admin password has been updated. All existing sessions were signed out.",
        "title": "Choose a new password",
        "validation": {
          "confirmMismatch": "Password confirmation does not match.",
          "confirmRequired": "Confirm your new password.",
          "passwordRequired": "Enter a new password.",
          "passwordTooShort": "Use at least 8 characters."
        }
      }
    }
  },
  "category": {
    "category": {
      "meta": {
        "description": "Explore the latest posts in the {{category}} category.",
        "keywords": "{{category}}, {{category}} category, {{category}} posts"
      },
      "no_posts": "No posts found in the {{category}} category.",
      "subtitle": "Explore the latest posts in the {{category}} category.",
      "title": "Posts in {{category}}"
    }
  },
  "common": {
    "common": {
      "andMore": "and {{count}} more",
      "backToTop": "Back to top",
      "categoryFilter": {
        "all": "All Categories"
      },
      "clearAll": "Clear All",
      "codeBlock": {
        "copied": "Copied!",
        "copy": "Copy",
        "hideLineNumbers": "Hide line numbers",
        "showLineNumbers": "Show line numbers"
      },
      "commentsCount_one": "{{count}} comment",
      "commentsCount_other": "{{count}} comments",
      "contactInfo": {
        "email": "Email"
      },
      "datePicker": {
        "applySelection": "Apply Selection",
        "clearSelection": "Clear Selection",
        "customDate": "Custom Date",
        "endDateLabel": "End Date",
        "endDatePlaceholder": "End Date",
        "last30Days": "Last 30 Days",
        "last7Days": "Last 7 Days",
        "selectDate": "Select Date",
        "startDateLabel": "Start Date",
        "startDatePlaceholder": "Start Date",
        "today": "Today",
        "yesterday": "Yesterday"
      },
      "footer": {
        "text": "© {{year}}-{{currentYear}} Şuayb's Blog. All rights reserved."
      },
      "header": {
        "actions": {
          "hideSearch": "Hide search",
          "openRss": "Open RSS feed",
          "showSearch": "Show search",
          "toggleSidebar": "Toggle sidebar"
        },
        "logoAlt": "Şuayb's Blog Logo",
        "menu": {
          "about": "About",
          "categories": "Categories",
          "contact": "Contact",
          "games": "Games",
          "home": "Home",
          "schulteTable": "Schulte Table",
          "search": "Search",
          "stroopTest": "Stroop Test",
          "visualMemory": "Visual Memory"
        },
        "theme": {
          "dark": "Dark Mode",
          "forest": "Forest Mode",
          "light": "Light Mode",
          "oceanic": "Oceanic Mode",
          "system": "System"
        },
        "themeToggle": "Toggle Theme",
        "title": "Şuayb's Blog",
        "voice": {
          "disabled": "Voice: Off",
          "enabled": "Voice: On",
          "label": "Voice"
        }
      },
      "language": "Language",
      "newsletterCallback": {
        "actions": {
          "goHome": "Go to blog",
          "subscribeAgain": "Subscribe again"
        },
        "confirm": {
          "status": {
            "config-error": {
              "message": "Newsletter confirmation is not configured correctly.",
              "title": "Configuration error"
            },
            "expired": {
              "message": "This confirmation link is expired or invalid. Please subscribe again.",
              "title": "Link expired"
            },
            "failed": {
              "message": "We could not confirm your subscription. Please try again.",
              "title": "Confirmation failed"
            },
            "invalid-link": {
              "message": "The confirmation link is missing or invalid.",
              "title": "Invalid link"
            },
            "method-not-allowed": {
              "message": "This endpoint only supports GET requests.",
              "title": "Invalid request"
            },
            "service-unavailable": {
              "message": "The confirmation service is temporarily unavailable. Try again in a few minutes.",
              "title": "Service unavailable"
            },
            "success": {
              "message": "Your email is now confirmed. You will receive newsletter updates.",
              "title": "Subscription confirmed"
            }
          },
          "title": "Subscription confirmation"
        },
        "eyebrow": "Newsletter",
        "loading": {
          "message": "Please wait while we process this newsletter action.",
          "title": "Processing your request"
        },
        "meta": {
          "description": "Status of your newsletter confirmation or unsubscribe action.",
          "title": "Newsletter status"
        },
        "unsubscribe": {
          "status": {
            "config-error": {
              "message": "Unsubscribe flow is not configured correctly.",
              "title": "Configuration error"
            },
            "failed": {
              "message": "We could not complete the unsubscribe request. Please try again.",
              "title": "Unsubscribe failed"
            },
            "invalid-link": {
              "message": "This unsubscribe link is invalid or expired.",
              "title": "Invalid link"
            },
            "method-not-allowed": {
              "message": "This endpoint only supports GET or POST requests.",
              "title": "Invalid request"
            },
            "service-unavailable": {
              "message": "The unsubscribe service is temporarily unavailable. Try again in a few minutes.",
              "title": "Service unavailable"
            },
            "success": {
              "message": "You have been unsubscribed successfully. You will no longer receive newsletter emails.",
              "title": "Unsubscribed"
            }
          },
          "title": "Unsubscribe"
        }
      },
      "noResults": "No results found",
      "pagination": {
        "pageSize": "Page size",
        "showingResults": "Showing {{start}}–{{end}} of {{total}} results"
      },
      "postMeta": {
        "published": "Published",
        "readingTime": "Reading time",
        "updated": "Updated"
      },
      "preFooter": {
        "aboutText": "Articles on Spring Boot, microservices, security, and more.",
        "aboutTitle": "About",
        "contactCta": "Contact",
        "latestPostsTitle": "Latest posts",
        "newsletter": {
          "description": "Get practical backend + fullstack notes when new articles are published.",
          "emailLabel": "Newsletter email",
          "errors": {
            "generic": "Something went wrong while subscribing. Please try again.",
            "invalidEmail": "Please enter a valid email address.",
            "rateLimited": "Too many requests. Please wait a minute and try again.",
            "required": "Email is required."
          },
          "honeypotLabel": "Are you a human? If so, please ignore this checkbox.",
          "placeholder": "you@domain.com",
          "resend": "Didn't get the email? Resend confirmation.",
          "resending": "Resending...",
          "resent": "Confirmation email sent again. Check your inbox and spam folder.",
          "submit": "Join",
          "submitting": "Joining...",
          "success": "Welcome aboard. Please check your inbox for the confirmation email."
        },
        "rss": "RSS",
        "socialTitle": "Social",
        "startHereCta": "Start here",
        "subscribeTitle": "Subscribe",
        "title": "Footer navigation",
        "topTopicsTitle": "Top topics"
      },
      "readingTime": {
        "fifteenPlus": "15+ min read",
        "minute": "{{count}} min read"
      },
      "readingTimeFilter": {
        "any": "All Reading Times",
        "range15plus": "15+ min",
        "range3to7": "3–7 min",
        "range8to12": "8–12 min"
      },
      "searchBar": {
        "clear": "Clear search",
        "placeholder": "Search"
      },
      "searchSource": {
        "blog": "Blog",
        "medium": "Medium"
      },
      "selectAll": "Select All",
      "selected": "Selected",
      "sidebar": {
        "loading": "Loading more topics...",
        "title": "Topics"
      },
      "siteName": "Şuayb Şimşek's Blog",
      "sort": {
        "newest": "Newest First",
        "oldest": "Oldest First"
      },
      "sourceFilter": {
        "all": "All Sources",
        "blog": "Blog",
        "medium": "Medium"
      },
      "status": {
        "loading": "Loading..."
      },
      "theme": "Theme",
      "validation": {
        "alpha": "This field should only contain letters.",
        "alphanumeric": "This field should only contain letters and numbers.",
        "datetimelocal": "This field should be a date and time.",
        "email": "Please enter a valid email address.",
        "endDateBeforeStartDate": "End date cannot be before start date.",
        "max": "This field cannot be more than {{ max }}.",
        "maxbytes": "This field cannot be more than {{ max }} bytes.",
        "maxlength": "This field cannot be longer than {{ max }} characters.",
        "min": "This field should be at least {{ min }}.",
        "minbytes": "This field should be at least {{ min }} bytes.",
        "minlength": "This field must be at least {{ min }} characters.",
        "number": "This field should be a number.",
        "passwordStrength": "Password must contain at least 8 characters, including an uppercase letter, a number, and a special character.",
        "pattern": "This field should match the pattern for {{ pattern }}.",
        "patternLogin": "This field can only contain letters, digits, and e-mail addresses.",
        "required": "This field is required.",
        "startDateAfterEndDate": "Start date cannot be after end date.",
        "url": "Please enter a valid URL."
      },
      "viewAllResults": "See all results for \"{{query}}\"",
      "viewDensity": {
        "default": "Default view",
        "editorial": "Editorial view",
        "grid": "Grid view",
        "label": "Density"
      }
    }
  },
  "contact": {
    "contact": {
      "description": "Feel free to reach out via email, LinkedIn, Medium, or GitHub. I’m always open to discussing new projects, collaborations, or opportunities!",
      "header": "Contact Me",
      "jobTitle": "Senior Software Engineer",
      "meta": {
        "description": "Get in touch with Şuayb Şimşek via email, LinkedIn, Medium, or GitHub. Always open to discussing new projects and collaborations.",
        "keywords": "Şuayb Şimşek, contact, email, LinkedIn, Medium, GitHub",
        "title": "Contact Information"
      },
      "title": "Contact Information"
    }
  },
  "games": {
    "games": {
      "schulte": {
        "badge": "Brain Exercise",
        "benchmark": {
          "building": {
            "copy": "Slow down and scan in lanes. Accuracy matters more than forcing pace too early.",
            "label": "Building",
            "time": "75+ sec"
          },
          "fast": {
            "copy": "Your scan is already efficient. Keep mistakes near zero before moving up in size.",
            "label": "Fast",
            "time": "Under 45 sec"
          },
          "steady": {
            "copy": "A solid working range for regular practice. Focus on rhythm before chasing extra speed.",
            "label": "Steady",
            "time": "45-75 sec"
          },
          "subtitle": "Use these ranges as a practical training reference for the classic 5×5 board, not as a strict diagnostic score.",
          "title": "5×5 Speed Guide"
        },
        "howToPlay": {
          "step1": "Pick a grid size from 3×3 up to 9×9 in the left panel, then start with a fresh board.",
          "step2": "Use Classic mode to scan upward from 1, or switch to Reverse mode if you want to work downward from the highest number.",
          "step3": "Use Restart to replay the same layout, New board for a reshuffle, and Highlight next number if you want an easier practice mode.",
          "step4": "Watch your timer, mistakes, and best time together, then move up to a larger grid once your accuracy stays consistent.",
          "title": "How To Play"
        },
        "kickerNote": "Interactive focus and visual scanning practice",
        "meta": {
          "description": "Play a Schulte Table online in your browser with timer, mistakes, best times, and multiple grid sizes for focus and visual scanning practice.",
          "keywords": "schulte table, focus game, brain exercise, visual scanning, attention training, online game",
          "title": "Schulte Table (Play Online)"
        },
        "notes": {
          "item1": "Short rounds (1-3 minutes) usually work better than long sessions when your goal is consistency and focus.",
          "item2": "If your eyes feel tired, stop and take a short break before the next round.",
          "item3": "Use mistakes + time together. Faster is only meaningful if accuracy stays stable.",
          "title": "Practice Notes"
        },
        "research": {
          "body1": "Schulte Tables are best understood as a structured visual-search and attention exercise. They are useful because they give a repeatable task with measurable outcomes (time + errors).",
          "body2": "Research on attention and cognitive training is more nuanced than many productivity claims suggest. Task performance can improve with practice, but transfer to broader cognitive outcomes may be limited or mixed depending on study design and outcome measures.",
          "sources": {
            "erpStudy": "Schulte grid training study (attention-related ERP changes; PubMed)",
            "origin": "Background / origin context (Schulte table overview)",
            "transferCaveat": "Cognitive training transfer limitations (review context; PubMed)",
            "visualSearchContext": "Visual search performance and training context (open-access review/article; PMC)"
          },
          "title": "Research Notes"
        },
        "subtitle": "Play a browser-based Schulte Table trainer to practice visual search speed, attention switching, and steady scanning without leaving the site.",
        "title": "Schulte Table",
        "trainer": {
          "actions": "Actions",
          "bestTime": "Best time",
          "cellAriaLabel": "Cell {{number}}",
          "clearBestForSize": "Clear best",
          "completeMessage": "Completed in {{time}} with {{mistakes}} mistake(s).",
          "controls": "Game controls",
          "gridSize": "Grid size",
          "hideControls": "Hide controls",
          "mistakes": "Mistakes",
          "mode": "Mode",
          "modes": {
            "classic": {
              "copy": "Count upward from 1",
              "title": "Classic"
            },
            "reverse": {
              "copy": "Count down from the top value",
              "title": "Reverse"
            }
          },
          "newBoard": "New board",
          "next": "Next",
          "noBestYet": "No best yet",
          "noRecentRuns": "No runs yet",
          "recentRunMistakes_one": "{{count}} mistake",
          "recentRunMistakes_other": "{{count}} mistakes",
          "recentRuns": "Recent runs",
          "restart": "Restart",
          "showControls": "Show controls",
          "showNextHint": "Highlight next number",
          "status": {
            "completed": "Completed",
            "idle": "Ready",
            "running": "Running"
          },
          "statusLabel": "Status",
          "timer": "Timer",
          "tip": "Tip: prioritize a smooth scanning rhythm over random fast clicks."
        },
        "whyUse": {
          "body1": "Schulte Tables are commonly used as a visual search and attention exercise. They are popular in reading and concentration practice because they force structured scanning across a grid.",
          "body2": "Treat this as a practice tool, not a medical or diagnostic tool. Improvements in this game do not automatically guarantee broad cognitive improvement in everyday tasks.",
          "title": "Why People Use It"
        }
      },
      "stroop": {
        "badge": "Brain Exercise",
        "colors": {
          "blue": "Blue",
          "green": "Green",
          "orange": "Orange",
          "purple": "Purple",
          "red": "Red",
          "yellow": "Yellow"
        },
        "howToPlay": {
          "step1": "Pick a mode from the left panel, then start a fresh round when you are ready.",
          "step2": "Look at the ink color of the word, not the word itself, and tap the matching color button.",
          "step3": "Use Restart to replay the current mode immediately, or switch modes for a different pace and trial count.",
          "step4": "Track score, mistakes, accuracy, and average reaction time together instead of chasing speed alone.",
          "title": "How To Play"
        },
        "kickerNote": "Color-word interference and reaction control practice",
        "meta": {
          "description": "Play a Stroop Test online in your browser with practice, standard, and timed modes, plus score, accuracy, and reaction-time tracking.",
          "keywords": "stroop test, stroop effect, brain exercise, reaction game, cognitive control, online game",
          "title": "Stroop Test (Play Online)"
        },
        "notes": {
          "item1": "Short sessions usually work better than long streaks when the goal is clean focus and consistent responses.",
          "item2": "If you start guessing, slow down and re-center on the ink color before continuing.",
          "item3": "Use accuracy and reaction time together. Fast mistakes are still weak reps.",
          "title": "Practice Notes"
        },
        "research": {
          "body1": "The Stroop effect is a classic interference task: reading is automatic, while naming the ink color requires more control. That conflict is why the task is still used in attention and executive-control research.",
          "body2": "As with other cognitive-training tasks, improvement inside the game is easy to measure, but transfer to broader cognitive benefits is more nuanced and depends on context, study design, and outcome measures.",
          "sources": {
            "automaticity": "Interference and automaticity review context (PMC)",
            "background": "Background overview (Stroop effect)",
            "taskReference": "Stroop Color-Word Task reference (NIDA)"
          },
          "title": "Research Notes"
        },
        "subtitle": "Play a browser-based Stroop Test to challenge cognitive control, reaction speed, and focus by matching the ink color instead of the written word.",
        "title": "Stroop Test",
        "trainer": {
          "accuracy": "Accuracy",
          "actions": "Actions",
          "avgReaction": "Avg reaction",
          "bestInterference": "Best interference",
          "bestScore": "Best score",
          "choiceGroup": "Color choices",
          "clearBest": "Clear best",
          "completeMessage": "Round complete. Score {{score}}, accuracy {{accuracy}}, average reaction {{avgMs}} ms.",
          "congruentAvg": "Congruent avg",
          "controls": "Game controls",
          "currentPrompt": "Current prompt",
          "hideControls": "Hide controls",
          "incongruentAvg": "Incongruent avg",
          "inkHint": "Ink color: {{color}}",
          "interference": "Interference",
          "mistakes": "Mistakes",
          "mode": "Mode",
          "modeLabel": "Mode",
          "modes": {
            "practice": {
              "copy": "20 prompts, lighter interference",
              "title": "Practice"
            },
            "standard": {
              "copy": "30 prompts, balanced difficulty",
              "title": "Standard"
            },
            "timed": {
              "copy": "60 seconds, keep the pace up",
              "title": "Timed"
            }
          },
          "newRound": "New round",
          "noBestYet": "No best yet",
          "noRecentRuns": "No runs yet",
          "recentRunAccuracy": "Accuracy {{accuracy}}",
          "recentRunAvg": "Avg {{avgMs}} ms",
          "recentRunInterference": "Interference {{deltaMs}}",
          "recentRunLabel": "Score {{score}}",
          "recentRuns": "Recent runs",
          "restart": "Restart",
          "rule": "Match the color of the text, not the word you read.",
          "score": "Score",
          "showControls": "Show controls",
          "showHint": "Show rule reminder",
          "status": {
            "completed": "Completed",
            "idle": "Ready",
            "running": "Running"
          },
          "statusLabel": "Status",
          "timer": "Timer",
          "tip": "Tip: if the word pulls your attention, pause for a beat and answer the ink color only.",
          "tipWithHint": "Tip: keep your eyes on the ink color first. The hint line is there to reinforce the rule while you warm up.",
          "wordSays": "Word says: {{word}}"
        },
        "whyUse": {
          "body1": "The Stroop task is widely used as a cognitive-control exercise because it forces you to suppress the automatic urge to read the word and respond to the font color instead.",
          "body2": "Treat this as a fast attention and inhibition practice tool, not a medical or diagnostic assessment. Better game scores do not automatically mean broad real-world cognitive gains.",
          "title": "Why People Use It"
        }
      },
      "visualMemory": {
        "badge": "Brain Exercise",
        "benchmark": {
          "building": {
            "copy": "You are still locking in the pattern-reading rhythm. Focus on clean recalls and stable lives.",
            "label": "Building",
            "time": "Levels 1-5"
          },
          "fast": {
            "copy": "A genuinely strong run for a casual browser session. Public benchmark-style profiles often start to look competitive in the low teens.",
            "label": "Strong",
            "time": "Level 11+"
          },
          "steady": {
            "copy": "A solid range for regular practice. At this point shape recognition matters more than raw tapping speed.",
            "label": "Steady",
            "time": "Levels 6-10"
          },
          "subtitle": "Use these ranges as lightweight context for browser-style visual memory runs, not as a diagnostic score.",
          "title": "Run Guide"
        },
        "howToPlay": {
          "step1": "Pick a mode from the left panel. Each mode changes grid size and how quickly the highlighted pattern disappears.",
          "step2": "Memorize the glowing tiles while the pattern is visible, then tap the same tiles after the board resets.",
          "step3": "Every completed round adds one more tile to remember, so the game scales naturally as your level rises.",
          "step4": "Use Restart to replay the same pattern, or New round to reset the run and start fresh from level one.",
          "title": "How To Play"
        },
        "kickerNote": "Pattern recall and short-term visual memory practice",
        "meta": {
          "description": "Play a visual memory game online in your browser with level progression, best score tracking, multiple grid sizes, and responsive controls.",
          "keywords": "visual memory game, memory game, brain exercise, pattern recall, online game, short term memory",
          "title": "Visual Memory (Play Online)"
        },
        "notes": {
          "item1": "Short focused sessions usually work better than long runs when recall quality starts to slip.",
          "item2": "Look for the overall shape of the pattern instead of memorizing isolated squares one by one.",
          "item3": "When a level feels noisy, pause for a beat before tapping. Clean recall matters more than frantic speed.",
          "title": "Practice Notes"
        },
        "research": {
          "body1": "Visual memory tasks usually sit near the border of attention and working-memory practice. They are easy to repeat and score, which makes them useful for lightweight self-tracking.",
          "body2": "Research on visual working memory often focuses on capacity limits, pattern maintenance, and change detection. Improvement inside a task can be clear, while wider transfer remains more nuanced.",
          "sources": {
            "background": "Background overview (Visual memory)",
            "capacityReview": "Visual working-memory capacity review context (PMC)",
            "changeDetection": "Change detection and visual memory context (PMC)"
          },
          "title": "Research Notes"
        },
        "subtitle": "Play a browser-based visual memory game that flashes a tile pattern, hides it, and asks you to rebuild it from memory before moving to the next level.",
        "title": "Visual Memory",
        "trainer": {
          "actions": "Actions",
          "bestLevel": "Best level",
          "bestScore": "Best score",
          "bestTiles": "Best tiles",
          "cellAriaLabel": "Memory cell {{index}}",
          "clearBest": "Clear best",
          "completeMessage": "You went out on level {{level}}, scored {{score}}, rebuilt {{tiles}} tile(s), and made {{mistakes}} mistake(s).",
          "controls": "Game controls",
          "currentRound": "Current round",
          "failRevealRule": "Review the {{count}}-tile pattern before the round ends.",
          "gameOverRule": "The run ended. Start a fresh round or replay the mode.",
          "gameOverTitle": "Game over",
          "gridHint": "Grid: {{size}}×{{size}}",
          "hideControls": "Hide controls",
          "idleRule": "Start a new round to reveal the first pattern.",
          "level": "Level",
          "lives": "Lives",
          "livesHint": "Lives left: {{count}}",
          "memorizeRule": "Memorize {{count}} highlighted tile(s).",
          "mistakes": "Mistakes",
          "mode": "Mode",
          "modeLabel": "Mode",
          "modes": {
            "easy": {
              "copy": "3×3 grid, slower reveal",
              "title": "Easy"
            },
            "expert": {
              "copy": "5×5 grid, faster pattern fade",
              "title": "Expert"
            },
            "standard": {
              "copy": "4×4 grid, balanced recall",
              "title": "Standard"
            }
          },
          "newRound": "New round",
          "noBestYet": "No best yet",
          "noRecentRuns": "No runs yet",
          "patternHint": "Pattern size: {{count}} tile(s)",
          "playAgain": "Play again",
          "recallRule": "Rebuild the {{count}}-tile pattern from memory.",
          "recentRunLabel": "Level {{level}}",
          "recentRunMistakes_one": "{{count}} mistake",
          "recentRunMistakes_other": "{{count}} mistakes",
          "recentRunScore": "Score {{score}}",
          "recentRunTiles_one": "{{count}} tile",
          "recentRunTiles_other": "{{count}} tiles",
          "recentRuns": "Recent runs",
          "rememberedTiles": "Remembered tiles",
          "restart": "Restart",
          "score": "Score",
          "showControls": "Show controls",
          "showHint": "Show recall hint",
          "startRound": "Start round",
          "status": {
            "gameOver": "Game over",
            "guess": "Recall",
            "idle": "Ready",
            "memorize": "Memorize",
            "revealFail": "Review"
          },
          "statusLabel": "Status",
          "targetTiles": "Target tiles",
          "timer": "Timer",
          "tip": "Tip: scan the whole pattern as one shape before you start tapping individual tiles.",
          "tipWithHint": "Tip: use the hint line to anchor the tile count, then memorize clusters instead of isolated squares."
        },
        "whyUse": {
          "body1": "Visual memory drills are popular because they turn short-term pattern recall into a simple, measurable task. You can track level growth, mistake count, and total remembered tiles in one session.",
          "body2": "Treat this as a practice tool, not a medical or diagnostic claim. Better in-game memory patterns do not automatically guarantee broad real-world cognitive transfer.",
          "title": "Why People Use It"
        }
      }
    }
  },
  "home": {
    "home": {
      "header": {
        "subtitle": "Explore the latest articles, tutorials, and insights.",
        "title": "Welcome to Şuayb's Blog"
      },
      "meta": {
        "description": "Explore the latest articles, tutorials, and insights on my blog. Discover a variety of topics including programming, technology, Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, microservice, artificial intelligence.",
        "keywords": "blog, articles, tutorials, programming, technology, artificial intelligence",
        "title": "Şuayb's Blog"
      },
      "title": "Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, Microservice, Artificial Intelligence"
    }
  },
  "medium": {
    "medium": {
      "header": {
        "subtitle": "Explore deep-dive articles and hands-on tutorials from my Medium blog.",
        "title": "My Writings on Medium"
      },
      "meta": {
        "description": "Read my technical blog posts on Medium. Topics include Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, and Microservices.",
        "keywords": "medium, blog, articles, programming, java, kotlin, kubernetes, spring boot, react, microservice",
        "title": "Articles by Şuayb Şimşek on Medium"
      },
      "title": "Medium Articles"
    }
  },
  "post": {
    "post": {
      "authorBox": {
        "bio": "Backend-focused fullstack developer sharing practical notes on Spring Boot, security, microservices, and cloud-native architecture.",
        "connectTitle": "Connect",
        "expertise": {
          "cloud": "Cloud Native",
          "go": "Go",
          "microservices": "Microservices",
          "nextjs": "Next.js",
          "spring": "Spring Boot"
        },
        "expertiseTitle": "Expertise",
        "links": {
          "github": "GitHub",
          "linkedin": "LinkedIn",
          "medium": "Medium"
        },
        "title": "Written by"
      },
      "comments": {
        "auth": {
          "cancelled": "{{provider}} sign-in was cancelled. You can still leave a guest comment by email.",
          "connected": "{{provider}} sign-in is ready. You can comment as {{name}}.",
          "copy": "Use email for a guest comment, or sign in with Google or GitHub to comment with your reader profile.",
          "email": "Email guest comment",
          "failed": "{{provider}} sign-in could not be completed. Try again or use email guest comment.",
          "github": "Continue with GitHub",
          "google": "Continue with Google",
          "loading": "Checking your comment session...",
          "providerHint": "{{provider}} account • {{email}}",
          "providers": {
            "account": "Reader",
            "github": "GitHub",
            "google": "Google"
          },
          "signOut": "Sign out",
          "signedInAs": "Signed in as {{name}}",
          "signedOut": "Signed out. You can continue with email guest comments.",
          "signingOut": "Signing out...",
          "title": "Comment access",
          "useEmail": "Use email guest comment"
        },
        "closeReply": "Close reply",
        "composerCopy": "Join the discussion with a note, question, or correction.",
        "composerTitle": "Add your comment",
        "copy": "Add a thoughtful note, question, or correction. Approved comments appear below.",
        "empty": "No approved comments yet. Start the discussion.",
        "emptyTitle": "No discussion yet",
        "errors": {
          "failed": "Comment could not be submitted.",
          "invalid-author": "Enter a valid display name.",
          "invalid-content": "Enter a comment between 3 and 2000 characters.",
          "invalid-email": "Enter a valid email address.",
          "invalid-parent": "This reply target is no longer available.",
          "invalid-post-id": "The article could not be found.",
          "load": "Comments are temporarily unavailable.",
          "not-found": "The article could not be found.",
          "rate-limited": "Too many comments submitted recently. Try again later.",
          "service-unavailable": "Comment service is temporarily unavailable."
        },
        "eyebrow": "Discussion",
        "form": {
          "cancelReply": "Cancel",
          "contentLabel": "Comment",
          "contentPlaceholder": "Write your comment",
          "emailLabel": "Email",
          "emailPlaceholder": "you@example.com",
          "helper": "Your email stays private. Only your display name appears with the comment.",
          "nameLabel": "Name",
          "namePlaceholder": "Your name",
          "replyingTo": "Replying to {{name}}",
          "submit": "Post comment",
          "submitReply": "Post reply",
          "submitting": "Submitting...",
          "viewerHelper": "Commenting as {{name}}. Your reader email stays private."
        },
        "hideReplies_one": "Hide 1 reply",
        "hideReplies_other": "Hide {{count}} replies",
        "loading": "Loading comments...",
        "moderationNote": "New comments are reviewed before they appear.",
        "postedAt": "Posted {{date}}",
        "replies_one": "1 reply",
        "replies_other": "{{count}} replies",
        "reply": "Reply",
        "streamTitle": "Discussion",
        "success": {
          "approved": "Your comment is now live.",
          "pending": "Your comment was received and is awaiting moderation."
        },
        "title_one": "1 comment",
        "title_other": "{{count}} comments",
        "viewReplies_one": "View 1 reply",
        "viewReplies_other": "View {{count}} replies"
      },
      "hit": {
        "aria": "{{count}} article hits",
        "error": "Hit counter is temporarily unavailable.",
        "loading": "Loading hits...",
        "title": "Total views"
      },
      "like": {
        "button": "Like this article",
        "countLabel": "Tap the heart to like",
        "error": "Like service is temporarily unavailable.",
        "loading": "Loading likes...",
        "sidebarLabel": "Article likes"
      },
      "navigation": {
        "next": "Next article",
        "previous": "Previous article",
        "title": "Post navigation"
      },
      "noPostsFound": "No posts found.",
      "readMore": "Read More",
      "readingProgress": {
        "ariaLabel": "Reading progress"
      },
      "relatedPostsTitle": "Related posts",
      "share": {
        "copied": "Copied",
        "copyLink": "Copy link",
        "onFacebook": "Share on Facebook",
        "onLinkedIn": "Share on LinkedIn",
        "onX": "Share on X",
        "shortCopied": "Copied",
        "shortCopy": "Copy",
        "shortFacebook": "Facebook",
        "shortLinkedIn": "LinkedIn",
        "shortX": "X",
        "title": "Share"
      },
      "tocTitle": "Table of contents",
      "updatedNoticeLabel": "Last updated"
    }
  },
  "search": {
    "search": {
      "meta": {
        "description": "Browse search results on our blog.",
        "keywords": "search, blog, articles"
      },
      "no_results": "No results found for \"{{query}}\".",
      "subtitle": "Displaying search results for \"{{query}}\"",
      "title": "Search Results"
    }
  },
  "topic": {
    "topic": {
      "allTopics": "All Topics",
      "meta": {
        "description": "Discover the latest posts and insights about {{topic}}. Stay updated with trends and articles.",
        "keywords": "{{topic}}, {{topic}} blog, insights on {{topic}}, {{topic}} trends"
      },
      "noTopicFound": "No topic found.",
      "no_posts": "No posts found for the topic {{topic}}.",
      "searchTopics": "Search Topics",
      "selectedTopics": "Selected Topics",
      "subtitle": "Explore the latest posts related to {{topic}}.",
      "title": "Posts about {{topic}}"
    }
  }
}

export default Resources;
