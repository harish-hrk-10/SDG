/**
 * ai-mock.js
 * Simulated AI NLP Service for Citizen Grievance Management
 */

const keywordMap = {
    Water: {
        keywords: ['water', 'leak', 'pipe', 'drain', 'sewage', 'flooding', 'tap'],
        priority: {
            high: ['burst', 'massive', 'flooding', 'emergency', 'no water'],
            med: ['leak', 'broken', 'sewage'],
            low: ['dripping', 'smell']
        }
    },
    Roads: {
        keywords: ['road', 'pothole', 'broken', 'pavement', 'traffic', 'signal', 'street'],
        priority: {
            high: ['accident', 'huge pothole', 'blocked', 'collapse'],
            med: ['pothole', 'signal', 'broken'],
            low: ['rough', 'uneven']
        }
    },
    Sanitation: {
        keywords: ['garbage', 'trash', 'waste', 'dump', 'smell', 'clean', 'sweep'],
        priority: {
            high: ['hazardous', 'dead', 'medical waste', 'blocking'],
            med: ['pile', 'overflowing', 'garbage'],
            low: ['litter', 'dirty']
        }
    },
    Electrical: {
        keywords: ['light', 'electricity', 'wire', 'pole', 'spark', 'power', 'blackout'],
        priority: {
            high: ['spark', 'live wire', 'fallen pole', 'fire', 'blackout'],
            med: ['streetlight', 'flickering', 'no power'],
            low: ['dim', 'bulb']
        }
    }
};

/**
 * Generates a concise summary based on the text.
 */
function generateSummary(text, dept) {
    // Simple mock summarization: just extract first sentence or shorten
    let summary = text.split('.')[0];
    if (summary.length > 50) {
        summary = summary.substring(0, 47) + '...';
    }
    return `Issue: ${summary}`;
}

/**
 * Simulates AI NLP processing
 * @param {string} text - The user's complaint text
 * @returns {Promise<Object>} - The categorized and prioritized data
 */
async function analyzeComplaint(text) {
    return new Promise((resolve) => {
        // Simulate network/processing delay (1-2 seconds)
        setTimeout(() => {
            const lowerText = text.toLowerCase();
            let detectedDept = 'General';
            let detectedPriority = 'low';
            let maxScore = 0;

            // Score each department based on keywords
            for (const [dept, data] of Object.entries(keywordMap)) {
                let score = 0;
                data.keywords.forEach(kw => {
                    if (lowerText.includes(kw)) score++;
                });

                if (score > maxScore) {
                    maxScore = score;
                    detectedDept = dept;
                }
            }

            // Determine priority within detected department
            if (detectedDept !== 'General') {
                const pData = keywordMap[detectedDept].priority;
                
                const hasHigh = pData.high.some(kw => lowerText.includes(kw));
                const hasMed = pData.med.some(kw => lowerText.includes(kw));
                
                if (hasHigh) {
                    detectedPriority = 'high';
                } else if (hasMed) {
                    detectedPriority = 'med';
                } else {
                    detectedPriority = 'low';
                }
            } else {
                // General fallback priority
                if (lowerText.includes('urgent') || lowerText.includes('emergency')) {
                    detectedPriority = 'high';
                } else {
                    detectedPriority = 'med';
                }
            }

            // Generate unique ID
            const id = 'CMP-' + Math.floor(1000 + Math.random() * 9000);

            resolve({
                id: id,
                department: detectedDept,
                priority: detectedPriority,
                summary: generateSummary(text, detectedDept),
                originalText: text,
                timestamp: new Date().toISOString(),
                status: 'Open'
            });

        }, 1500); // 1.5s delay
    });
}

// Export for global access if needed, or simply attach to window
window.AI = {
    analyzeComplaint
};
