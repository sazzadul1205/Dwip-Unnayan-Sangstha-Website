<?php
// app/Services/SectionPayloadNormalizer.php

namespace App\Services;

/**
 * Canonical normaliser for section payloads stored in the JSON columns
 * (`custom_section_data.data`, `shared_data.data`).
 *
 * Background
 * ----------
 * Some editors persist an extra `{ "data": { ... } }` wrapper (see
 * SectionEditModal::handleSubmit -> submitData.data, which forwards whatever
 * shape an editor emitted via onDataChange), while others store the payload
 * flat. Both shapes therefore exist side by side in production.
 *
 * Both models cast the column to `array`, so the old
 * `if (is_string($rawData)) { ... $decodedData['data'] ?? $decodedData }`
 * unwrapping in Cms\SectionController never actually ran — which is why every
 * editor had to guess with `section.data.data ?? section.data`.
 *
 * This class makes the unwrap explicit, shared by the CMS and the public
 * frontend, and idempotent (safe to run on already-unwrapped payloads).
 */
final class SectionPayloadNormalizer
{
    /**
     * Unwrap a stored section payload into the shape the UI expects.
     *
     * - JSON strings are decoded first (legacy rows / raw DB values).
     * - The `{ data: [...] }` wrapper is collapsed ONLY when `data` is the sole
     *   key and its value is an array. A genuine payload that happens to carry a
     *   `data` field alongside other keys is never truncated.
     */
    public static function unwrap(mixed $payload): mixed
    {
        if (is_string($payload)) {
            $decoded = json_decode($payload, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return $payload;
            }

            $payload = $decoded;
        }

        if (self::isWrapper($payload)) {
            return $payload['data'];
        }

        return $payload;
    }

    /**
     * Whether the payload is nothing but the legacy `{ data: [...] }` wrapper.
     */
    public static function isWrapper(mixed $payload): bool
    {
        return is_array($payload)
            && count($payload) === 1
            && array_key_exists('data', $payload)
            && is_array($payload['data']);
    }
}
