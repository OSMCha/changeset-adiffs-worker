import parseAugmentedDiff from "@osmcha/osm-adiff-parser";
import changetags from "./changetags.js";

type Environment = {
  // bindings
  readonly CHANGESET_ADIFFS: Queue;
  readonly BUCKET: R2Bucket;
  // env vars
  readonly OSMCHA_API_URL: string;
  readonly OSMCHA_ADMIN_TOKEN: string;
};

export default {
  async queue(batch: MessageBatch<any>, env: Environment): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Fetch and decompress the augmented diff file from R2
        let r2object = await env.BUCKET.get(message.body.object.key);
        let decompressed = r2object.body.pipeThrough(new DecompressionStream("gzip"));
        let xmlString = await (new Response(decompressed)).text();

        // Parse the adiff file and compute the tag changes
        let adiff = await parseAugmentedDiff(xmlString);
        let changes = changetags(adiff);
        let plainChanges = Object.fromEntries(changes.entries().map(([k, v]) => [k, Array.from(v)]));

        // Post the changes to the OSMCha Django backend
        let id = message.body.object.key.split("/").reverse()[0].split(".")[0];
        let url = `${env.OSMCHA_API_URL}/changesets/${id}/tag-changes/`;
        let res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Token ${env.OSMCHA_ADMIN_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(plainChanges),
        });

        if (!res.ok) {
          throw new Error(`POST ${url} -> HTTP ${res.status} (body: ${await res.text()})`);
        }
      } catch (err) {
        console.error(err);
      }
    }
  },
};
