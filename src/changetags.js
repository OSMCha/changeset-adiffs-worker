/* Given a parsed Augmented Diff, return an object describing the tags that were
 * added, modified, or deleted in the changeset.
 *
 * This function is intended to produce identical output to
 * developmentseed/changetags [1], but works on XML adiff files parsed using
 * @osmcha/osm-adiff-parser instead of on Real-Changesets JSON [2].
 *
 * [1]: https://github.com/developmentseed/changetags
 * [2]: https://github.com/osmus/osmcha-charter-project/blob/main/real-changesets-docs.md
 */

const MAIN_TAGS = new Set([
  "aerialway",
  "aeroway",
  "amenity",
  "barrier",
  "boundary",
  "building",
  "highway",
  "historic",
  "landuse",
  "leisure",
  "man_made",
  "military",
  "natural",
  "office",
  "place",
  "power",
  "public_transport",
  "railway",
  "route",
  "shop",
  "tourism",
  "waterway"
]);

export default function changetags(adiff) {
  let changes = new Map();

  let addKV = (key, value) => {
    if (!value) return;
    if (changes.has(key)) {
      changes.get(key).add(value);
    } else {
      changes.set(key, new Set([value]));
    }
  }

  for (let action of adiff.actions) {
    switch (action.type) {
      case "create":
        for (let [key, value] of Object.entries(action.new.tags)) {
          if (MAIN_TAGS.has(key)) {
            addKV(key, value);
          }
        }
        break;      
      case "modify":
        if (action.old.version === action.new.version) {
          // Skip 'modify' elements that haven't actually changed (OSMCha's
          // adiff generator includes elements like these as context)
          break;
        }
        let oldKeys = new Set(Object.keys(action.old.tags));
        let newKeys = new Set(Object.keys(action.new.tags));

        let mainTags = MAIN_TAGS.intersection(newKeys);
        let addedKeys = newKeys.difference(oldKeys);
        let deletedKeys = oldKeys.difference(newKeys);
        let changedKeys = Array.from(oldKeys.intersection(newKeys))
          .filter(key => action.old.tags[key] !== action.new.tags[key]);

        for (let key of addedKeys) {
          addKV(key, action.new.tags[key]);
        }
        for (let key of deletedKeys) {
          addKV(key, action.old.tags[key]);
        }
        for (let key of changedKeys) {
          addKV(key, action.old.tags[key]);
          addKV(key, action.new.tags[key]);
        }
        for (let key of mainTags) {
          addKV(key, action.old.tags[key]);
          addKV(key, action.new.tags[key]);
        }
        break;      
      case "delete":
        for (let [key, value] of Object.entries(action.old.tags)) {
          if (MAIN_TAGS.has(key)) {
            addKV(key, value);
          }
        }
        break;      
    }
  }

  return changes;
}
