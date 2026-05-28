import { Extension } from '@tiptap/core'

const INDENT_PX = 40
const INDENT_MAX = 7
const BLOCK_TYPES = ['paragraph', 'heading']

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      increaseIndent: () => ReturnType
      decreaseIndent: () => ReturnType
    }
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const px = parseInt((el as HTMLElement).style.paddingLeft || '0')
              return px ? Math.round(px / INDENT_PX) : 0
            },
            renderHTML: ({ indent }) => {
              if (!indent) return {}
              return { style: `padding-left: ${indent * INDENT_PX}px` }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
            if (BLOCK_TYPES.includes(node.type.name)) {
              const next = Math.min((node.attrs.indent ?? 0) + 1, INDENT_MAX)
              if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
            }
          })
          return true
        },

      decreaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          let canRun = false
          state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
            if (BLOCK_TYPES.includes(node.type.name) && (node.attrs.indent ?? 0) > 0) {
              canRun = true
              if (dispatch) {
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: (node.attrs.indent ?? 0) - 1 })
              }
            }
          })
          return canRun
        },
    }
  },
})
