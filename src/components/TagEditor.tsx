// Edit the tag list: rename, recolour, remove, add. Lives inside Settings.

import { useTagStore } from '../state/tagStore';
import styles from './SettingsView.module.css';

export function TagEditor() {
  const { tags, addTag, updateTag, removeTag } = useTagStore();

  return (
    <div>
      {tags.map((tag) => (
        <div key={tag.id} className={styles.tagRow}>
          <input
            type="color"
            className={styles.color}
            value={tag.color}
            aria-label={`Colour of ${tag.name}`}
            onChange={(e) => updateTag(tag.id, { color: e.target.value })}
          />
          <input
            className={styles.tagName}
            value={tag.name}
            maxLength={30}
            aria-label="Tag name"
            onChange={(e) => updateTag(tag.id, { name: e.target.value })}
          />
          <button
            className={styles.smallButton}
            aria-label={`Remove ${tag.name}`}
            onClick={() => removeTag(tag.id)}
          >
            ✕
          </button>
        </div>
      ))}
      <button className={styles.button} onClick={addTag}>
        + Add tag
      </button>
    </div>
  );
}
