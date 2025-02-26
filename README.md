This is a Cloudflare Worker which processes new changeset augmented diffs. It computes the tag changes (which represent the types of features have been modified) and pushes them to the osmcha.org backend.

## Implementation details

New changeset adiffs are built by a server running the [osmx-adiff-builder](https://github.com/OSMCha/osmx-adiff-builder) code. That server uploads the adiffs to a Cloudflare R2 bucket. The contents of that bucket are then served at `adiffs.osmcha.org`.

When new adiffs are uploaded to a bucket, Cloudflare is configured to push an event into a queue. A worker running the code in this repository listens for events on that queue and processes them. Currently the worker's only responsibility is to compute _tag changes_ (a summary of which kinds of OSM features were modified by the changeset) and POST them to the osmcha.org [Django backend](https://github.com/OSMCha/osmcha-django) so that users can filter changesets based on this info.

In the future, it might make sense to also make this worker responsible for notifying the Django backend of the existence of new changesets. Currently the Django backend polls for new changesets (it runs `python manage.py fetchchangesets` every two minutes from a Cron job), but pushing them from the worker would likely make new changesets appear in the UI more quickly after they are created.

## License

This code is released under the ISC license. See the LICENSE file for details.
