// scripts/societies.js
// This script fetches student society data and renders it on the homepage.

// Data for student societies, using the names you provided and updated arts-related societies.
const societiesData = [
    {
        name: "ZILSA (Zimbabwe Law Students Association)",
        description: "The official representative body for law students in Zimbabwe, focusing on professional development, advocacy, and networking.",
        imageSrc: "https://placehold.co/400x250/003366/ffffff?text=ZILSA",
        tags: ["Professional", "Advocacy", "Networking", "Representative"]
    },
    {
        name: "LSIF (Law Students Intellectual Forum)",
        description: "A forum dedicated to critical thinking, academic discourse, and intellectual debate on complex legal and societal issues.",
        imageSrc: "https://placehold.co/400x250/b30000/ffffff?text=LSIF",
        tags: ["Academic", "Debate", "Intellectual", "Discussion"]
    },
    {
        name: "Moot Society of Zimbabwe",
        description: "Develops oral advocacy skills through mock trials and appellate arguments, preparing students for legal practice.",
        imageSrc: "https://placehold.co/400x250/004d00/ffffff?text=Moot+Society",
        tags: ["Advocacy", "Litigation", "Competition"]
    },
    {
        name: "The Law School Poets Guild",
        description: "An platform for law students to explore their passion for poetry, short stories, and creative writing. This is an outlet for artists to connect and share their work.",
        imageSrc: "https://placehold.co/400x250/5c007a/ffffff?text=Poetry",
        tags: ["Poetry", "Creative Writing", "Storytelling"]
    },
    {
        name: "The Creative Ink & Quill Society",
        description: "A society for law students to express themselves through prose writing, storytelling, and journalism. A space to master clear and compelling communication in any medium.",
        imageSrc: "https://placehold.co/400x250/8a0026/ffffff?text=Prose",
        tags: ["Prose", "Writing", "Journalism"]
    },
    {
        name: "The Barristers' Palette & Brush Society",
        description: "An outlet for law students to explore visual art in any form, from painting and drawing to digital art and photography. This is a community for artists to connect, inspire and get inspired.",
        imageSrc: "https://placehold.co/400x250/007399/ffffff?text=Art+Society",
        tags: ["Art", "Drawing", "Photography", "Expression"]
    },
];

// This function will be called once the societies container is loaded.
function renderSocieties(container, template) {
    if (!container || !template) {
        console.error("Societies container or template not found.");
        return;
    }

    societiesData.forEach(society => {
        let cardHtml = template;
        
        // Replace placeholders with actual data
        cardHtml = cardHtml.replace("{{ imageSrc }}", society.imageSrc);
        cardHtml = cardHtml.replace("{{ societyName }}", society.name);
        cardHtml = cardHtml.replace("{{ description }}", society.description);

        // Generate tags HTML
        const tagsHtml = society.tags.map(tag => `<span class="society-tag">${tag}</span>`).join('');
        cardHtml = cardHtml.replace("<!-- Dynamically injected tags here -->", tagsHtml);

        // Append the new card to the container
        container.innerHTML += cardHtml;
    });
}

// ... (all of your societiesData and renderSocieties function) ...

// **-- CHANGE THIS PART --**
// We will now listen for the standard 'DOMContentLoaded' event instead.
// This is the correct approach for a page where the content is already in the HTML.
document.addEventListener("DOMContentLoaded", () => {
    console.log("societies.js: DOMContentLoaded event received. Rendering societies.");
    
    // Fetch the container and template
    const societiesContainer = document.getElementById("societies-container");
    const societyTemplateContainer = document.getElementById("society-card-template");
    const societyTemplate = societyTemplateContainer?.innerHTML;

    if (societiesContainer && societyTemplate) {
        // Clear the template element before rendering
        societyTemplateContainer.innerHTML = '';
        renderSocieties(societiesContainer, societyTemplate);
    } else {
        console.error("Could not find societies container or template.");
    }
});
