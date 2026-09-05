// js/utils/createContactImage.js
/**
 * Convert sensitive contact information into a clickable image.
 *
 * Supported types:
 * - email
 * - phone
 *
 * Example:
 * createContactImage({
 *     type: "email",
 *     value: "hello@example.com",
 *     alt: "Email us"
 * });
 */

export default function createContactImage({
    type,
    value,
    alt = "",
    fontSize = 18,
    fontFamily = "Arial",
    textColor = "#000000",
    backgroundColor = "transparent",
    padding = 5,
}) {
    if (!type || !value) {
        throw new Error("type and value are required.");
    }

    if (!["email", "phone"].includes(type)) {
        throw new Error('type must be either "email" or "phone".');
    }

    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Configure font
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Measure text
    const textWidth = ctx.measureText(value).width;
    const textHeight = fontSize;

    // Set canvas size
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Background
    if (backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Text
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = "top";

    ctx.fillText(value, padding, padding);

    // Convert canvas to image
    const image = document.createElement("img");

    image.src = canvas.toDataURL("image/png");
    image.alt = alt || type;
    image.style.cursor = "pointer";

    // Create clickable link
    const link = document.createElement("a");

    if (type === "email") {
        link.href = `mailto:${value}`;
    }

    if (type === "phone") {
        link.href = `tel:${value}`;
    }

    link.appendChild(image);

    return link;
}