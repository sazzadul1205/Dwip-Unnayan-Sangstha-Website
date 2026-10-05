<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The base tables of the database the application is actually connected to.
 *
 * Seeders and console commands need to enumerate tables to truncate or report
 * on, and getting that list wrong is destructive rather than merely wrong: on a
 * developer machine whose MySQL account can also see another project's schema,
 * a naive listing yields hundreds of foreign tables and truncating them fails
 * mid-run.
 */
final class CurrentDatabaseTables
{
    /**
     * Bare, unqualified table names for the current database.
     *
     * @return array<int, string>
     */
    public static function names(): array
    {
        $connection = DB::connection();

        // The schema argument is not optional in practice. With null, MySQL's
        // grammar only excludes the system schemas, so `getTables()` spans
        // every other database the user can see — it returned 384 tables from
        // an unrelated schema here, and none from this one. Passing the
        // database name pins it to `table_schema = ?`.
        //
        // SQLite names its schemas itself ("main") and stores the file path in
        // getDatabaseName(), so any explicit value there would match nothing;
        // it scopes by attached schema anyway.
        $schema = $connection->getDriverName() === 'sqlite'
            ? null
            : $connection->getDatabaseName();

        // Unqualified, so no caller has to strip a schema prefix — and no
        // caller can get the stripping wrong, or compare it case-sensitively
        // against a database name MySQL has already lower-cased.
        $names = Schema::getTableListing($schema, false);

        // SQLite still reports the attached schema in some versions.
        return array_values(array_filter(array_map(
            fn ($table) => Str::afterLast((string) $table, '.'),
            $names
        )));
    }
}
