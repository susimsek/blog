interface Resources {
  '404': {
    '404': {
      backToHome: 'Back to Home';
      description: 'The page you are looking for does not exist or has been moved. Please check the URL or return to the homepage.';
      errorCode: '404';
      header: 'Oops! Page Not Found';
      meta: {
        description: 'The page you are looking for does not exist or has been moved.';
      };
      title: '404 - Page Not Found';
    };
  };
  about: {
    about: {
      description: 'Hi, I’m Şuayb Şimşek, a passionate backend and fullstack developer from Turkey. I graduated in Computer Engineering from TOBB University of Economics and Technology. Over the past {{experienceYears}} years, I have gained extensive experience in backend, frontend, blockchain, and DevOps technologies.';
      findMeOnline: 'Get in Touch with Me';
      header: 'About Me';
      jobTitle: 'Senior Software Engineer';
      meta: {
        description: 'Learn more about Şuayb Şimşek, a passionate backend and fullstack developer from Turkey. Explore his experience, education, and online presence.';
        keywords: 'Şuayb Şimşek, backend developer, fullstack developer, blockchain, DevOps';
        title: 'About Me';
      };
      title: 'About Me';
    };
  };
  category: {
    category: {
      meta: {
        description: 'Explore the latest posts in the {{category}} category.';
        keywords: '{{category}}, {{category}} category, {{category}} posts';
      };
      no_posts: 'No posts found in the {{category}} category.';
      subtitle: 'Explore the latest posts in the {{category}} category.';
      title: 'Posts in {{category}}';
    };
  };
  common: {
    common: {
      andMore: 'and {{count}} more';
      backToTop: 'Back to top';
      categoryFilter: {
        all: 'All Categories';
      };
      clearAll: 'Clear All';
      codeBlock: {
        copied: 'Copied!';
        copy: 'Copy';
        hideLineNumbers: 'Hide line numbers';
        showLineNumbers: 'Show line numbers';
      };
      contactInfo: {
        email: 'Email';
      };
      datePicker: {
        applySelection: 'Apply Selection';
        clearSelection: 'Clear Selection';
        customDate: 'Custom Date';
        endDateLabel: 'End Date';
        endDatePlaceholder: 'End Date';
        last30Days: 'Last 30 Days';
        last7Days: 'Last 7 Days';
        selectDate: 'Select Date';
        startDateLabel: 'Start Date';
        startDatePlaceholder: 'Start Date';
        today: 'Today';
        yesterday: 'Yesterday';
      };
      footer: {
        text: "© {{year}}-{{currentYear}} Şuayb's Blog. All rights reserved.";
      };
      header: {
        actions: {
          hideSearch: 'Hide search';
          openRss: 'Open RSS feed';
          showSearch: 'Show search';
          toggleSidebar: 'Toggle sidebar';
        };
        logoAlt: "Şuayb's Blog Logo";
        menu: {
          about: 'About';
          categories: 'Categories';
          contact: 'Contact';
          games: 'Games';
          home: 'Home';
          schulteTable: 'Schulte Table';
          search: 'Search';
        };
        theme: {
          dark: 'Dark Mode';
          forest: 'Forest Mode';
          light: 'Light Mode';
          oceanic: 'Oceanic Mode';
          system: 'System';
        };
        themeToggle: 'Toggle Theme';
        title: "Şuayb's Blog";
        voice: {
          disabled: 'Voice: Off';
          enabled: 'Voice: On';
          label: 'Voice';
        };
      };
      language: 'Language';
      newsletterCallback: {
        actions: {
          goHome: 'Go to blog';
          subscribeAgain: 'Subscribe again';
        };
        confirm: {
          status: {
            'config-error': {
              message: 'Newsletter confirmation is not configured correctly.';
              title: 'Configuration error';
            };
            expired: {
              message: 'This confirmation link is expired or invalid. Please subscribe again.';
              title: 'Link expired';
            };
            failed: {
              message: 'We could not confirm your subscription. Please try again.';
              title: 'Confirmation failed';
            };
            'invalid-link': {
              message: 'The confirmation link is missing or invalid.';
              title: 'Invalid link';
            };
            'method-not-allowed': {
              message: 'This endpoint only supports GET requests.';
              title: 'Invalid request';
            };
            'service-unavailable': {
              message: 'The confirmation service is temporarily unavailable. Try again in a few minutes.';
              title: 'Service unavailable';
            };
            success: {
              message: 'Your email is now confirmed. You will receive newsletter updates.';
              title: 'Subscription confirmed';
            };
          };
          title: 'Subscription confirmation';
        };
        eyebrow: 'Newsletter';
        loading: {
          message: 'Please wait while we process this newsletter action.';
          title: 'Processing your request';
        };
        meta: {
          description: 'Status of your newsletter confirmation or unsubscribe action.';
          title: 'Newsletter status';
        };
        unsubscribe: {
          status: {
            'config-error': {
              message: 'Unsubscribe flow is not configured correctly.';
              title: 'Configuration error';
            };
            failed: {
              message: 'We could not complete the unsubscribe request. Please try again.';
              title: 'Unsubscribe failed';
            };
            'invalid-link': {
              message: 'This unsubscribe link is invalid or expired.';
              title: 'Invalid link';
            };
            'method-not-allowed': {
              message: 'This endpoint only supports GET or POST requests.';
              title: 'Invalid request';
            };
            'service-unavailable': {
              message: 'The unsubscribe service is temporarily unavailable. Try again in a few minutes.';
              title: 'Service unavailable';
            };
            success: {
              message: 'You have been unsubscribed successfully. You will no longer receive newsletter emails.';
              title: 'Unsubscribed';
            };
          };
          title: 'Unsubscribe';
        };
      };
      noResults: 'No results found';
      pagination: {
        pageSize: 'Page size';
        showingResults: 'Showing {{start}}–{{end}} of {{total}} results';
      };
      postMeta: {
        published: 'Published';
        readingTime: 'Reading time';
        updated: 'Updated';
      };
      preFooter: {
        aboutText: 'Articles on Spring Boot, microservices, security, and more.';
        aboutTitle: 'About';
        contactCta: 'Contact';
        latestPostsTitle: 'Latest posts';
        newsletter: {
          description: 'Get practical backend + fullstack notes when new articles are published.';
          emailLabel: 'Newsletter email';
          errors: {
            generic: 'Something went wrong while subscribing. Please try again.';
            invalidEmail: 'Please enter a valid email address.';
            rateLimited: 'Too many requests. Please wait a minute and try again.';
            required: 'Email is required.';
          };
          honeypotLabel: 'Are you a human? If so, please ignore this checkbox.';
          placeholder: 'you@domain.com';
          resend: "Didn't get the email? Resend confirmation.";
          resending: 'Resending...';
          resent: 'Confirmation email sent again. Check your inbox and spam folder.';
          submit: 'Join';
          submitting: 'Joining...';
          success: 'Welcome aboard. Please check your inbox for the confirmation email.';
        };
        rss: 'RSS';
        socialTitle: 'Social';
        startHereCta: 'Start here';
        subscribeTitle: 'Subscribe';
        title: 'Footer navigation';
        topTopicsTitle: 'Top topics';
      };
      readingTime: {
        fifteenPlus: '15+ min read';
        minute: '{{count}} min read';
      };
      readingTimeFilter: {
        any: 'All Reading Times';
        range15plus: '15+ min';
        range3to7: '3–7 min';
        range8to12: '8–12 min';
      };
      searchBar: {
        clear: 'Clear search';
        placeholder: 'Search';
      };
      searchSource: {
        blog: 'Blog';
        medium: 'Medium';
      };
      selectAll: 'Select All';
      selected: 'Selected';
      sidebar: {
        loading: 'Loading more topics...';
        title: 'Topics';
      };
      siteName: "Şuayb Şimşek's Blog";
      sort: {
        newest: 'Newest First';
        oldest: 'Oldest First';
      };
      sourceFilter: {
        all: 'All Sources';
        blog: 'Blog';
        medium: 'Medium';
      };
      theme: 'Theme';
      validation: {
        alpha: 'This field should only contain letters.';
        alphanumeric: 'This field should only contain letters and numbers.';
        datetimelocal: 'This field should be a date and time.';
        email: 'Please enter a valid email address.';
        endDateBeforeStartDate: 'End date cannot be before start date.';
        max: 'This field cannot be more than {{ max }}.';
        maxbytes: 'This field cannot be more than {{ max }} bytes.';
        maxlength: 'This field cannot be longer than {{ max }} characters.';
        min: 'This field should be at least {{ min }}.';
        minbytes: 'This field should be at least {{ min }} bytes.';
        minlength: 'This field must be at least {{ min }} characters.';
        number: 'This field should be a number.';
        passwordStrength: 'Password must contain at least 8 characters, including an uppercase letter, a number, and a special character.';
        pattern: 'This field should match the pattern for {{ pattern }}.';
        patternLogin: 'This field can only contain letters, digits, and e-mail addresses.';
        required: 'This field is required.';
        startDateAfterEndDate: 'Start date cannot be after end date.';
        url: 'Please enter a valid URL.';
      };
      viewAllResults: 'See all results for "{{query}}"';
      viewDensity: {
        default: 'Default view';
        editorial: 'Editorial view';
        grid: 'Grid view';
        label: 'Density';
      };
    };
  };
  contact: {
    contact: {
      description: 'Feel free to reach out via email, LinkedIn, Medium, or GitHub. I’m always open to discussing new projects, collaborations, or opportunities!';
      header: 'Contact Me';
      jobTitle: 'Senior Software Engineer';
      meta: {
        description: 'Get in touch with Şuayb Şimşek via email, LinkedIn, Medium, or GitHub. Always open to discussing new projects and collaborations.';
        keywords: 'Şuayb Şimşek, contact, email, LinkedIn, Medium, GitHub';
        title: 'Contact Information';
      };
      title: 'Contact Information';
    };
  };
  games: {
    games: {
      schulte: {
        badge: 'Brain Exercise';
        howToPlay: {
          step1: 'Pick a grid size from 3×3 up to 9×9 in the left panel, then start with a fresh board.';
          step2: 'Find and click the numbers in ascending order, starting from 1 and following the Next indicator.';
          step3: 'Use Restart to replay the same layout, New board for a reshuffle, and Highlight next number if you want an easier practice mode.';
          step4: 'Watch your timer, mistakes, and best time together, then move up to a larger grid once your accuracy stays consistent.';
          title: 'How To Play';
        };
        kickerNote: 'Interactive focus and visual scanning practice';
        meta: {
          description: 'Play a Schulte Table online in your browser with timer, mistakes, best times, and multiple grid sizes for focus and visual scanning practice.';
          keywords: 'schulte table, focus game, brain exercise, visual scanning, attention training, online game';
          title: 'Schulte Table (Play Online)';
        };
        notes: {
          item1: 'Short rounds (1-3 minutes) usually work better than long sessions when your goal is consistency and focus.';
          item2: 'If your eyes feel tired, stop and take a short break before the next round.';
          item3: 'Use mistakes + time together. Faster is only meaningful if accuracy stays stable.';
          title: 'Practice Notes';
        };
        research: {
          body1: 'Schulte Tables are best understood as a structured visual-search and attention exercise. They are useful because they give a repeatable task with measurable outcomes (time + errors).';
          body2: 'Research on attention and cognitive training is more nuanced than many productivity claims suggest. Task performance can improve with practice, but transfer to broader cognitive outcomes may be limited or mixed depending on study design and outcome measures.';
          sources: {
            erpStudy: 'Schulte grid training study (attention-related ERP changes; PubMed)';
            origin: 'Background / origin context (Schulte table overview)';
            transferCaveat: 'Cognitive training transfer limitations (review context; PubMed)';
            visualSearchContext: 'Visual search performance and training context (open-access review/article; PMC)';
          };
          title: 'Research Notes';
        };
        subtitle: 'Play a browser-based Schulte Table trainer to practice visual search speed, attention switching, and steady scanning without leaving the site.';
        title: 'Schulte Table';
        trainer: {
          actions: 'Actions';
          bestTime: 'Best time';
          cellAriaLabel: 'Cell {{number}}';
          clearBestForSize: 'Clear best';
          completeMessage: 'Completed in {{time}} with {{mistakes}} mistake(s).';
          controls: 'Game controls';
          gridSize: 'Grid size';
          hideControls: 'Hide controls';
          mistakes: 'Mistakes';
          newBoard: 'New board';
          next: 'Next';
          noBestYet: 'No best yet';
          restart: 'Restart';
          showControls: 'Show controls';
          showNextHint: 'Highlight next number';
          status: {
            completed: 'Completed';
            idle: 'Ready';
            running: 'Running';
          };
          statusLabel: 'Status';
          timer: 'Timer';
          tip: 'Tip: prioritize a smooth scanning rhythm over random fast clicks.';
        };
        whyUse: {
          body1: 'Schulte Tables are commonly used as a visual search and attention exercise. They are popular in reading and concentration practice because they force structured scanning across a grid.';
          body2: 'Treat this as a practice tool, not a medical or diagnostic tool. Improvements in this game do not automatically guarantee broad cognitive improvement in everyday tasks.';
          title: 'Why People Use It';
        };
      };
    };
  };
  home: {
    home: {
      header: {
        subtitle: 'Explore the latest articles, tutorials, and insights.';
        title: "Welcome to Şuayb's Blog";
      };
      meta: {
        description: 'Explore the latest articles, tutorials, and insights on my blog. Discover a variety of topics including programming, technology, Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, microservice, artificial intelligence.';
        keywords: 'blog, articles, tutorials, programming, technology, artificial intelligence';
        title: "Şuayb's Blog";
      };
      title: 'Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, Microservice, Artificial Intelligence';
    };
  };
  medium: {
    medium: {
      header: {
        subtitle: 'Explore deep-dive articles and hands-on tutorials from my Medium blog.';
        title: 'My Writings on Medium';
      };
      meta: {
        description: 'Read my technical blog posts on Medium. Topics include Java, Kotlin, Kubernetes, Blockchain, Spring Boot, Golang, React, and Microservices.';
        keywords: 'medium, blog, articles, programming, java, kotlin, kubernetes, spring boot, react, microservice';
        title: 'Articles by Şuayb Şimşek on Medium';
      };
      title: 'Medium Articles';
    };
  };
  post: {
    post: {
      authorBox: {
        bio: 'Backend-focused fullstack developer sharing practical notes on Spring Boot, security, microservices, and cloud-native architecture.';
        connectTitle: 'Connect';
        expertise: {
          cloud: 'Cloud Native';
          go: 'Go';
          microservices: 'Microservices';
          nextjs: 'Next.js';
          spring: 'Spring Boot';
        };
        expertiseTitle: 'Expertise';
        links: {
          github: 'GitHub';
          linkedin: 'LinkedIn';
          medium: 'Medium';
        };
        title: 'Written by';
      };
      hit: {
        aria: '{{count}} article hits';
        error: 'Hit counter is temporarily unavailable.';
        loading: 'Loading hits...';
        title: 'Total views';
      };
      like: {
        button: 'Like this article';
        countLabel: 'Tap the heart to like';
        error: 'Like service is temporarily unavailable.';
        loading: 'Loading likes...';
        sidebarLabel: 'Article likes';
      };
      navigation: {
        next: 'Next article';
        previous: 'Previous article';
        title: 'Post navigation';
      };
      noPostsFound: 'No posts found.';
      readMore: 'Read More';
      readingProgress: {
        ariaLabel: 'Reading progress';
      };
      relatedPostsTitle: 'Related posts';
      share: {
        copied: 'Copied';
        copyLink: 'Copy link';
        onFacebook: 'Share on Facebook';
        onLinkedIn: 'Share on LinkedIn';
        onX: 'Share on X';
        shortCopied: 'Copied';
        shortCopy: 'Copy';
        shortFacebook: 'Facebook';
        shortLinkedIn: 'LinkedIn';
        shortX: 'X';
        title: 'Share';
      };
      tocTitle: 'Table of contents';
      updatedNoticeLabel: 'Last updated';
    };
  };
  search: {
    search: {
      meta: {
        description: 'Browse search results on our blog.';
        keywords: 'search, blog, articles';
      };
      no_results: 'No results found for "{{query}}".';
      subtitle: 'Displaying search results for "{{query}}"';
      title: 'Search Results';
    };
  };
  topic: {
    topic: {
      allTopics: 'All Topics';
      meta: {
        description: 'Discover the latest posts and insights about {{topic}}. Stay updated with trends and articles.';
        keywords: '{{topic}}, {{topic}} blog, insights on {{topic}}, {{topic}} trends';
      };
      noTopicFound: 'No topic found.';
      no_posts: 'No posts found for the topic {{topic}}.';
      searchTopics: 'Search Topics';
      selectedTopics: 'Selected Topics';
      subtitle: 'Explore the latest posts related to {{topic}}.';
      title: 'Posts about {{topic}}';
    };
  };
}

export default Resources;
