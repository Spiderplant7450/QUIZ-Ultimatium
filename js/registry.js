/**
 * ============================================================================
 * REGISTRY.JS - Subject and Chapter Registry
 * ============================================================================
 * 
 * This file acts as the central directory for all subjects, books, and chapters
 * in the quiz application. It DOES NOT contain the actual questions - it only
 * maps chapter names to their respective data files.
 * 
 * Structure:
 * subjectsRegistry = {
 *   "Subject Name": {
 *     "Book Name": {
 *       "Chapter Name": {
 *         path: "relative/path/to/chapter/data.js",
 *         count: number of questions in this chapter
 *       }
 *     }
 *   }
 * }
 * 
 * Usage:
 * - Loaded on all pages to populate subject/chapter dropdowns
 * - Used to dynamically load chapter question files during test
 * ============================================================================
 */

const subjectsRegistry = {
    "Political Science": {
        "Contemporary World Politics": {
            "The End of Bipolarity": { path: "data/political-science/cwp-bipolarity.js", count: 78 },
            "Contemporary Centres of Power": { path: "data/political-science/cwp-power.js", count: 100 },
            "Contemporary South Asia": { path: "data/political-science/cwp-south-asia.js", count: 154 },
            "International Organisations": { path: "data/political-science/cwp-un.js", count: 87 },
            "Security in the Contemporary World": { path: "data/political-science/cwp-security.js", count: 92 },
            "Environment and Natural Resources": { path: "data/political-science/cwp-environment.js", count: 119 },
            "Globalisation": { path: "data/political-science/cwp-globalisation.js", count: 21 }
        },
        "Politics in India Since Independence": {
            "Challenges of Nation-Building": { path: "data/political-science/pisi-nation-building.js", count: 89 },
            "Era of One-Party Dominance": { path: "data/political-science/pisi-one-party.js", count: 122 },
            "Politics of Planned Development": { path: "data/political-science/pisi-planned-dev.js", count: 64 },
            "India's External Relations": { path: "data/political-science/pisi-external-relations.js", count: 115 },
            "Challenges to and Restoration of the Congress System": { path: "data/political-science/pisi-congress-restoration.js", count: 107 },
            "The Crisis of Democratic Order": { path: "data/political-science/pisi-democratic-crisis.js", count: 84 },
            "Regional Aspirations": { path: "data/political-science/pisi-regional-aspirations.js", count: 188 },
            "Recent Developments in Indian Politics": { path: "data/political-science/pisi-recent-developments.js", count: 109 }
        }
    },
    "History": {
        "Themes in Indian History - I": {
            "Bricks, Beads and Bones": { path: "data/history/theme1-bricks.js", count: 75 },
            "Kings, Farmers and Towns": { path: "data/history/theme1-kings.js", count: 59 },
            "Kinship, Caste and Class": { path: "data/history/theme1-kinship.js", count: 77 },
            "Thinkers, Beliefs and Buildings": { path: "data/history/theme1-thinkers.js", count: 66 }
        },
        "Themes in Indian History - II": {
            "Through the Eyes of Travellers": { path: "data/history/theme2-travellers.js", count: 57 },
            "Bhakti-Sufi Traditions": { path: "data/history/theme2-bhakti.js", count: 67 },
            "An Imperial Capital: Vijayanagara": { path: "data/history/theme2-capital.js", count: 65 },
            "Peasants, Zamindars and the State": { path: "data/history/theme2-peasants.js", count: 60 }
        },
        "Themes in Indian History - III": {
            "Colonialism and the Countryside": { path: "data/history/theme3-colonialism.js", count: 95 },
            "Rebels and the Raj": { path: "data/history/theme3-rebels.js", count: 63 },
            "Mahatma Gandhi and the Nationalist Movement": { path: "data/history/theme3-gandhi.js", count: 67 },
            "Framing the Constitution": { path: "data/history/theme3-constitution.js", count: 132 }
        }
    },
    "Geography": {
        "Fundamentals of Human Geography": {
            "Human Geography: Nature and Scope": { path: "data/geography/human-geo.js", count: 0 }
        }
    }
};

// Export for use in other JavaScript files
// Works in both browser and Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = subjectsRegistry;
}
