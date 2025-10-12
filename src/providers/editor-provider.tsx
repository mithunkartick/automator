'use client'

import { EditorActions, EditorNodeType } from '@/lib/types'
import { stat } from 'fs';
import {
    Dispatch,
    createContext,
    useContext,
    useEffect,
    useReducer,
} from 'react'

export type EditorNode = EditorNodeType;

export type Editor = {
    elements: EditorNode[]
    edges: {
        id: string
        source: string
        target: string
    }[]
    selectedNode: EditorNodeType
}

export type HistoryState = {
    history: Editor[]
    currentIndex: number
}

export type EditorState = {
    editor: Editor
    history: HistoryState
}

const initialEditorState: EditorState['editor'] = {
    elements: [],
    selectedNode: {
        id: '',
        type: 'Trigger',
        position: { x: 0, y: 0 },
        data: {
            completed: false,
            current: false,
            description: '',
            metadata: {},
            title: '',
            type: 'Trigger',
        },
    },
    edges: [],
}

const initialHistoryState: HistoryState = {
    history: [initialEditorState],
    currentIndex: 0,
}

const initialState: EditorState = {
    editor: initialEditorState,
    history: initialHistoryState,
}

const editorReducer = (state: EditorState, action: any): EditorState => {
    switch (action.type) {
        default:
            return state
        case 'REDO':
            if (state.history.currentIndex < state.history.history.length - 1) {
                const newIndex = state.history.currentIndex + 1
                const nextEditorState = { ...state.history.history[newIndex] }
                return {
                    ...state,
                    editor: state.history.history[newIndex],
                    history: {
                        ...state.history,
                        currentIndex: newIndex,
                    },
                }
            }
            return state
        case 'UNDO':
            if (state.history.currentIndex > 0) {
                const prevIndex = state.history.currentIndex - 1
                const prevEditorState = { ...state.history.history[prevIndex] }
                const undoState = {
                    ...state,
                    editor: prevEditorState,
                    history: {
                        ...state.history,
                        currentIndex: prevIndex,
                    },
                }
                return undoState
            }
            return state
        case 'LOAD_DATA':
            // Reconcile selectedNode to point to the canonical element object
            const newElements: EditorNode[] = action.payload.elements || initialEditorState.elements
            const prevSelectedId = state.editor?.selectedNode?.id
            const reconciledSelected =
                newElements.find((n: EditorNode) => n.id === prevSelectedId) || state.editor.selectedNode

            return {
                ...state,
                editor: {
                    ...state.editor,
                    elements: newElements,
                    edges: action.payload.edges,
                    selectedNode: reconciledSelected,
                },
            }
        case 'SELECTED_ELEMENT':
            return {
                ...state,
                editor: {
                    ...state.editor,
                    // payload should contain an element to mark as selected
                    selectedNode: action.payload.element || state.editor.selectedNode,
                },
            }
    }
}

export type EditorContextData = {
    previewMode: boolean
    setPreviewMode: (previewMode: boolean) => void
}

export const EditorContext = createContext<{
    state: EditorState
    dispatch: Dispatch<EditorActions>
}>({
    state: initialState,
    dispatch: () => undefined,
})

type EditorProps = {
    children: React.ReactNode
}

const EditorProvider = (props: EditorProps) => {
    const [state, dispatch] = useReducer(editorReducer, initialState)
    return (
        <EditorContext.Provider value={{ state, dispatch }}>
            {props.children}
        </EditorContext.Provider>
    )
}

export const useEditor = () => {
    const context=useContext(EditorContext)
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider')
                }
    return context
}        

export default EditorProvider
