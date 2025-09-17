// Test formatting changes
const testContent = `Robert Redford, the legendary actor, director, and champion of independent film, has died at the age of 89. Redford passed away on September 16, 2025, at his home at Sundance in the mountains of Utah, surrounded by loved ones, according to a statement from his publicist Cindi Berger[1][3][5]. His passing marks the end of a profound era in Hollywood, defined by his remarkable on-screen presence, his work as an Oscar-winning filmmaker, and his enduring influence on the industry through the Sundance Institute.

**A Final Chapter for a Hollywood Icon**

Redford's death follows a period of declining health. While earlier reports and rumors speculated on his health challenges—including an aggressive cancer diagnosis and previous battles with illness—the most definitive recent news is the announcement of his peaceful passing at home[1][2]. Details from family and publicists emphasized his desire for privacy in his final days and the deep love he held for Sundance, the artistic and environmental sanctuary he built in Utah.`;

// Test our citation removal
const cleanContent = testContent.replace(/\[\d+\]/g, '');

console.log('Original content:');
console.log(testContent);
console.log('\n' + '='.repeat(50) + '\n');
console.log('Cleaned content (citations removed):');
console.log(cleanContent);

// Test title capitalization
const testTitle = "robert redford: The Untold Story Behind Recent Headlines";
const capitalizedTitle = testTitle.charAt(0).toUpperCase() + testTitle.slice(1);

console.log('\n' + '='.repeat(50) + '\n');
console.log('Original title:', testTitle);
console.log('Capitalized title:', capitalizedTitle);

// Test sources formatting
const citations = [
  "https://www.youtube.com/watch?v=f5xa5xLcFx4",
  "https://laist.com/brief/news/arts-and-entertainment/robert-redford-has-died-at-age-89-sundance-movie-star",
  "https://wausaupilotandreview.com/2025/09/16/oscar-winner-robert-redford-who-became-a-champion-of-independent-film-dies-at-89/"
];

const searchResults = [
  {
    title: "Hollywood icon Robert Redford dead at 89 - YouTube",
    url: "https://www.youtube.com/watch?v=f5xa5xLcFx4"
  },
  {
    title: "Robert Redford has died - LAist",
    url: "https://laist.com/brief/news/arts-and-entertainment/robert-redford-has-died-at-age-89-sundance-movie-star"
  },
  {
    title: "Oscar winner Robert Redford, who became a champion of ...",
    url: "https://wausaupilotandreview.com/2025/09/16/oscar-winner-robert-redford-who-became-a-champion-of-independent-film-dies-at-89/"
  }
];

// Test sources section formatting with HTML links
function formatSourcesSection(citations, searchResults) {
  const sources = [];
  let sourceIndex = 1;

  const searchResultsMap = new Map();
  if (searchResults) {
    searchResults.forEach(result => {
      if (result.url) {
        searchResultsMap.set(result.url, result);
      }
    });
  }

  citations.forEach(citation => {
    if (citation && typeof citation === 'string') {
      const searchResult = searchResultsMap.get(citation);
      if (searchResult && searchResult.title) {
        sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">${searchResult.title}</a>`);
      } else {
        try {
          const domain = new URL(citation).hostname.replace('www.', '');
          sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">${domain}</a>`);
        } catch {
          sources.push(`${sourceIndex}. <a href="${citation}" target="_blank" rel="noopener noreferrer">Source</a>`);
        }
      }
      sourceIndex++;
    }
  });

  if (sources.length === 0) {
    return '';
  }

  return `## Sources\n\n${sources.join('\n')}`;
}

// Test tags formatting with HTML and CSS
function formatTagsSection(tags) {
  if (tags.length === 0) {
    return '';
  }

  const tagElements = tags.map(tag => {
    const cleanTag = tag.toLowerCase().trim();
    const displayTag = cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1);

    const searchUrl = `/articles?tag=${encodeURIComponent(cleanTag)}`;

    return `<span class="article-tag">
      <a href="${searchUrl}" class="tag-link" title="Zobrazit další články s tagem '${displayTag}'">
        #${displayTag}
      </a>
    </span>`;
  }).join(' ');

  return `\n\n## Tags\n\n<div class="tags-container">\n${tagElements}\n</div>

<style>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.article-tag {
  display: inline-block;
}

.tag-link {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tag-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  color: white;
  text-decoration: none;
}

.tag-link:visited {
  color: white;
}
</style>`;
}

console.log('\n' + '='.repeat(50) + '\n');
console.log('Sources section:');
console.log(formatSourcesSection(citations, searchResults));

// Test tags formatting
const tags = ['entertainment', 'robert', 'redford', 'trending', 'news'];
const tagsSection = formatTagsSection(tags);

console.log('\n' + '='.repeat(50) + '\n');
console.log('Tags section:');
console.log(tagsSection);
