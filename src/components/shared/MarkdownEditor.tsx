'use client';

import React from 'react';
import { RichTextEditor, type RichTextEditorProps } from './RichTextEditor';

export type MarkdownEditorProps = RichTextEditorProps;

export const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
  return <RichTextEditor {...props} />;
};

export default MarkdownEditor;
