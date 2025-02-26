import parseAugmentedDiff from "@osmcha/osm-adiff-parser";
import changetags from "./changetags.js";

type Environment = {
  readonly CHANGESET_ADIFFS: Queue;
  BUCKET: R2Bucket;
};

export default {
  async queue(batch: MessageBatch<any>, env: Environment): Promise<void> {
    // Do something with messages in the batch
    // i.e. write to R2 storage, D1 database, or POST to an external API
    // You can also iterate over each message in the batch by looping over batch.messages
    for (const message of batch.messages) {
      let res = await env.BUCKET.get(message.body.object.key);
      let decompressed = res.body.pipeThrough(new DecompressionStream("gzip"));
      let xmlString = await (new Response(decompressed)).text();
      let adiff = await parseAugmentedDiff(xmlString);
      let changes = changetags(adiff);

      // TODO: post the tag changes to osmcha.org/api/v1/changesets/:id/tag-changes/
      // ...for now, just log them
      console.log(message.body.object.key, JSON.stringify(Object.fromEntries(changes.entries().map(([k, v]) => [k, Array.from(v)]))));
    }
  },
};
