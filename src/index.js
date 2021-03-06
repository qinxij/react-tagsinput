import React from 'react'

function uniq (arr) {
  let out = []

  for (let i = 0; i < arr.length; i++) {
    if (out.indexOf(arr[i]) === -1) {
      out.push(arr[i])
    }
  }

  return out
}

function defaultRenderTag (props) {
  let {tag, key, onRemove, classNameRemove, ...other} = props
  return (
    <span key={key} {...other}>
      {tag}
      <a className={classNameRemove} onClick={(e) => onRemove(key)} />
    </span>
  )
}

defaultRenderTag.propTypes = {
  key: React.PropTypes.number,
  tag: React.PropTypes.string,
  onRemove: React.PropTypes.func,
  classNameRemove: React.PropTypes.string
}

function defaultRenderInput (props) {
  let {onChange, value, ...other} = props
  return (
    <input type='text' onChange={onChange} value={value} {...other} />
  )
}

defaultRenderInput.propTypes = {
  value: React.PropTypes.string,
  onChange: React.PropTypes.func
}

function defaultRenderLayout (tagComponents, inputComponent) {
  return (
    <span>
      {tagComponents}
      {inputComponent}
    </span>
  )
}

function defaultPasteSplit (data) {
  return data.split(' ').map(d => d.trim())
}

class TagsInput extends React.Component {
  constructor () {
    super()
    this.state = {tag: ''}
    this.focus = ::this.focus
    this.blur = ::this.blur
  }

  static propTypes = {
    addKeys: React.PropTypes.array,
    addOnBlur: React.PropTypes.bool,
    addOnPaste: React.PropTypes.bool,
    inputProps: React.PropTypes.object,
    onChange: React.PropTypes.func.isRequired,
    removeKeys: React.PropTypes.array,
    renderInput: React.PropTypes.func,
    renderTag: React.PropTypes.func,
    renderLayout: React.PropTypes.func,
    pasteSplit: React.PropTypes.func,
    tagProps: React.PropTypes.object,
    onlyUnique: React.PropTypes.bool,
    value: React.PropTypes.array.isRequired,
    maxTags: React.PropTypes.number,
    validationRegex: React.PropTypes.instanceOf(RegExp)
  }

  static defaultProps = {
    className: 'react-tagsinput',
    addKeys: [9, 13],
    addOnBlur: false,
    addOnPaste: false,
    inputProps: {className: 'react-tagsinput-input'},
    removeKeys: [8],
    renderInput: defaultRenderInput,
    renderTag: defaultRenderTag,
    renderLayout: defaultRenderLayout,
    pasteSplit: defaultPasteSplit,
    tagProps: {className: 'react-tagsinput-tag', classNameRemove: 'react-tagsinput-remove'},
    onlyUnique: false,
    maxTags: -1,
    validationRegex: /.*/
  }

  _removeTag (index) {
    let value = this.props.value.concat([])
    if (index > -1 && index < value.length) {
      let changed = value.splice(index, 1)
      this.props.onChange(value, changed, [index])
    }
  }

  _clearInput () {
    this.setState({tag: ''})
  }

  _addTags (tags) {
    let {validationRegex, onChange, onlyUnique, maxTags, value} = this.props

    // 1. Strip non-unique tags
    if (onlyUnique) {
      tags = uniq(tags)
      tags = tags.filter(tag => value.indexOf(tag) === -1)
    }

    // 2. Strip invalid tags
    tags = tags.filter(tag => validationRegex.test(tag))
    tags = tags.filter(tag => tag.trim().length > 0)

    // 3. Strip extras based on limit
    if (maxTags >= 0) {
      let remainingLimit = Math.max(maxTags - value.length, 0)
      tags = tags.slice(0, remainingLimit)
    }

    // 4. Add remaining tags to value
    if (tags.length > 0) {
      let newValue = value.concat(tags)
      let indexes = []
      for (let i = 0; i < tags.length; i++) {
        indexes.push(value.length + i)
      }
      onChange(newValue, tags, indexes)
      this._clearInput()
    }
  }

  focus () {
    this.refs.input.focus()
  }

  blur () {
    this.refs.input.focus()
  }

  accept () {
    let {tag} = this.state
    if (tag !== '') {
      this._addTags([tag])
    }
  }

  handlePaste (e) {
    let {addOnPaste, pasteSplit} = this.props

    if (!addOnPaste) {
      return
    }

    e.preventDefault()

    let data = e.clipboardData.getData('text/plain')
    let tags = pasteSplit(data)

    this._addTags(tags)
  }

  handleKeyDown (e) {
    let {value, removeKeys, addKeys} = this.props
    let {tag} = this.state
    let empty = tag === ''
    let add = addKeys.indexOf(e.keyCode) !== -1
    let remove = removeKeys.indexOf(e.keyCode) !== -1

    if (add) {
      e.preventDefault()
      this.accept()
    }

    if (remove && value.length > 0 && empty) {
      e.preventDefault()
      this._removeTag(value.length - 1)
    }
  }

  handleClick (e) {
    if (e.target === this.refs.div) {
      this.focus()
    }
  }

  handleChange (e) {
    let {onChange} = this.props.inputProps
    let tag = e.target.value

    if (onChange) {
      onChange(e)
    }

    this.setState({tag})
  }

  handleOnBlur (e) {
    if (this.props.addOnBlur) {
      this._addTags([e.target.value])
    }
  }

  handleRemove (tag) {
    this._removeTag(tag)
  }

  inputProps () {
    // eslint-disable-next-line
    let {onChange, ...otherInputProps} = this.props.inputProps
    return otherInputProps
  }

  render () {
    // eslint-disable-next-line
    let {value, onChange, inputProps, tagProps, renderLayout, renderTag, renderInput, addKeys, removeKeys, ...other} = this.props
    let {tag} = this.state

    let tagComponents = value.map((tag, index) => {
      return renderTag({key: index, tag, onRemove: ::this.handleRemove, ...tagProps})
    })

    let inputComponent = renderInput({
      ref: 'input',
      value: tag,
      onPaste: ::this.handlePaste,
      onKeyDown: ::this.handleKeyDown,
      onChange: ::this.handleChange,
      onBlur: ::this.handleOnBlur,
      ...this.inputProps()
    })

    return (
      <div ref='div' onClick={::this.handleClick} {...other}>
        {renderLayout(tagComponents, inputComponent)}
      </div>
    )
  }
}

export default TagsInput
