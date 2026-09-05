import { useEffect, useState, useCallback, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, $createHeadingNode } from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';

import './RichTextEditor.css';

/**
 * Serialization Decision:
 * We serialize the Lexical editor state to an HTML string using @lexical/html.
 * HTML is clean, portable, export-friendly (.html downloads), and the backend stores
 * note content verbatim as a string.
 */

const editorTheme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    underline: 'editor-text-underline',
  },
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        const type = element.getType();
        if (type === 'heading') {
          const tag = element.getTag();
          setBlockType(tag);
        } else if (type === 'list') {
          const listType = element.getListType();
          setBlockType(listType === 'number' ? 'ol' : 'ul');
        } else {
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingTag) => {
    if (blockType !== headingTag) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      });
    } else {
      formatParagraph();
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  return (
    <div className="editor-toolbar" aria-label="Text formatting">
      <button
        type="button"
        className={`toolbar-btn ${isBold ? 'toolbar-btn--active' : ''}`}
        onClick={() => formatText('bold')}
        title="Bold"
        aria-label="Format Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={`toolbar-btn ${isItalic ? 'toolbar-btn--active' : ''}`}
        onClick={() => formatText('italic')}
        title="Italic"
        aria-label="Format Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={`toolbar-btn ${isUnderline ? 'toolbar-btn--active' : ''}`}
        onClick={() => formatText('underline')}
        title="Underline"
        aria-label="Format Underline"
      >
        <u>U</u>
      </button>

      <div className="toolbar-divider" />

      <button
        type="button"
        className={`toolbar-btn ${blockType === 'h1' ? 'toolbar-btn--active' : ''}`}
        onClick={() => formatHeading('h1')}
        title="Heading 1"
        aria-label="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        className={`toolbar-btn ${blockType === 'h2' ? 'toolbar-btn--active' : ''}`}
        onClick={() => formatHeading('h2')}
        title="Heading 2"
        aria-label="Heading 2"
      >
        H2
      </button>

      <div className="toolbar-divider" />

      <button
        type="button"
        className={`toolbar-btn ${blockType === 'ul' ? 'toolbar-btn--active' : ''}`}
        onClick={formatBulletList}
        title="Bullet List"
        aria-label="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        className={`toolbar-btn ${blockType === 'ol' ? 'toolbar-btn--active' : ''}`}
        onClick={formatNumberedList}
        title="Numbered List"
        aria-label="Numbered List"
      >
        1. List
      </button>
    </div>
  );
}

function InitialContentPlugin({ initialContent, noteId }) {
  const [editor] = useLexicalComposerContext();
  const draftsRef = useRef(new Set());
  const lastLoadedContentRef = useRef(null);
  const prevNoteIdRef = useRef(noteId);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        draftsRef.current.add(html);
        if (draftsRef.current.size > 50) {
          const firstItem = draftsRef.current.values().next().value;
          draftsRef.current.delete(firstItem);
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    const isNoteIdentityChanged = prevNoteIdRef.current !== noteId;
    prevNoteIdRef.current = noteId;

    if (isNoteIdentityChanged) {
      lastLoadedContentRef.current = null;
      draftsRef.current.clear();
      if (!initialContent) {
        editor.update(() => {
          $getRoot().clear();
        });
        return;
      }
    }

    if (!initialContent) return;

    if (draftsRef.current.has(initialContent)) {
      return;
    }

    if (lastLoadedContentRef.current === initialContent) {
      return;
    }

    lastLoadedContentRef.current = initialContent;
    draftsRef.current.clear();

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialContent, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom.body);
        root.append(...nodes);
      } catch {
        // Fallback for plain text
        const paragraph = $createParagraphNode();
        paragraph.append(initialContent);
        root.append(paragraph);
      }
    });
  }, [editor, initialContent, noteId]);

  return null;
}

export default function RichTextEditor({
  initialContent = '',
  onChange,
  placeholder = 'Write your note here...',
  className = '',
  noteId,
  noteIdentity,
}) {
  const initialConfig = {
    namespace: 'InkwellEditor',
    theme: editorTheme,
    nodes: [HeadingNode, ListNode, ListItemNode],
    onError: (error) => console.error(error),
  };

  const handleEditorChange = (editorState, editor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      if (onChange) {
        onChange(htmlString);
      }
    });
  };

  return (
    <div className={`rich-text-editor ${className}`.trim()}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="editor-container">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="editor-placeholder">{placeholder}</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={handleEditorChange} />
          <InitialContentPlugin
            initialContent={initialContent}
            noteId={noteId ?? noteIdentity}
          />
        </div>
      </LexicalComposer>
    </div>
  );
}
