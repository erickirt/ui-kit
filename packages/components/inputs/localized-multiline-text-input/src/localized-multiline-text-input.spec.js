import { Component } from 'react';
import PropTypes from 'prop-types';
import { render, fireEvent } from '../../../../../test/test-utils';
import LocalizedMultilineTextInput from './localized-multiline-text-input';

// We use this component to simulate the whole flow of
// changing a value and formatting on blur.
class TestComponent extends Component {
  static displayName = 'TestComponent';
  static propTypes = {
    id: PropTypes.string,
    value: PropTypes.objectOf(PropTypes.string).isRequired,
    onChange: PropTypes.func,
    selectedLanguage: PropTypes.string.isRequired,
  };
  static defaultProps = {
    id: 'some-id',
    name: 'some-name',
    value: {
      en: 'Oh no, oh no, oh no. no',
      fr: "Calisse d'ostie de tabarnak",
    },
    selectedLanguage: 'en',
    intl: { formatMessage: (message) => message.id },
  };

  state = {
    value: this.props.value || {},
    selectedLanguage: this.props.selectedLanguage || '',
  };

  handleChange = (event) => {
    event.persist();
    this.setState({
      value: {
        ...this.state.value,
        [event.target.language]: event.target.value,
      },
    });
  };

  render() {
    return (
      <LocalizedMultilineTextInput
        {...this.props}
        onChange={this.props.onChange || this.handleChange}
        value={this.state.value}
        selectedLanguage={this.state.selectedLanguage}
      />
    );
  }
}

const renderLocalizedMultilineTextInput = (props, options) =>
  render(<TestComponent {...props} />, options);

it('should forward data-attributes', () => {
  const { container } = renderLocalizedMultilineTextInput({
    'data-foo': 'bar',
  });
  expect(container.querySelector('[data-foo="bar"]')).toBeInTheDocument();
});

it('should have an HTML name', () => {
  const { getByLabelText } = renderLocalizedMultilineTextInput({
    name: 'foo',
  });
  expect(getByLabelText('EN')).toHaveAttribute('name', 'foo.en');
});

it('should pass autoComplete', () => {
  const { getByLabelText } = renderLocalizedMultilineTextInput({
    autoComplete: 'off',
  });
  expect(getByLabelText('EN')).toHaveAttribute('autoComplete', 'off');
});

it('should have focus automatically when isAutofocussed is passed', () => {
  const { getByLabelText } = renderLocalizedMultilineTextInput({
    isAutofocussed: true,
  });
  expect(getByLabelText('EN')).toHaveFocus();
});

describe('when collapsed', () => {
  it('should render an input for the selected language (en)', () => {
    const { getByLabelText } = renderLocalizedMultilineTextInput();
    expect(getByLabelText('EN')).toBeInTheDocument();
  });
});

it('should call onFocus when the input is focused', async () => {
  const onFocus = jest.fn();
  const { getByLabelText } = renderLocalizedMultilineTextInput({ onFocus });
  const input = getByLabelText('EN');
  await fireEvent.asyncFocus(input);
  expect(input).toHaveFocus();
  expect(onFocus).toHaveBeenCalled();
});

it('should call onBlur when input loses focus', async () => {
  const onBlur = jest.fn();
  const { getByLabelText } = renderLocalizedMultilineTextInput({ onBlur });
  const input = getByLabelText('EN');
  await fireEvent.asyncFocus(input);
  expect(input).toHaveFocus();
  await fireEvent.asyncBlur(input);
  expect(input).not.toHaveFocus();
  expect(onBlur).toHaveBeenCalled();
});

describe('when input is collapsed', () => {
  it('should allow changing value of the input', () => {
    const { getByLabelText } = renderLocalizedMultilineTextInput();
    const event = { target: { value: 'I want chicken' } };
    const input = getByLabelText('EN');
    fireEvent.focus(input);
    fireEvent.change(input, event);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyUp(input, { key: 'Enter' });
    expect(input.value).toEqual('I want chicken');
  });
});

describe('when input is expanded', () => {
  it('should expand and show all language inputs when `Show all languages` is clicked', async () => {
    const { getByLabelText, findByLabelText } =
      renderLocalizedMultilineTextInput();
    const showAllLangBtn = await findByLabelText(/show all languages/i);
    fireEvent.click(showAllLangBtn);
    expect(getByLabelText('FR')).toBeInTheDocument();
  });
  it('should display all additionalInfo', async () => {
    const { getByText, findByLabelText } = renderLocalizedMultilineTextInput({
      additionalInfo: {
        en: 'cool description',
        fr: 'une description',
      },
    });
    const showAllLangBtn = await findByLabelText(/show all languages/i);
    fireEvent.click(showAllLangBtn);
    expect(getByText('cool description')).toBeInTheDocument();
    expect(getByText('une description')).toBeInTheDocument();
  });
  it('should allow changing the french input', async () => {
    const { getByLabelText, findByLabelText } =
      renderLocalizedMultilineTextInput();
    const showAllLangBtn = await findByLabelText(/show all languages/i);
    fireEvent.click(showAllLangBtn);
    const event = { target: { value: 'Je veux manger du poulet' } };
    const frenchInput = getByLabelText('FR');
    fireEvent.focus(frenchInput);
    fireEvent.change(frenchInput, event);
    fireEvent.keyDown(frenchInput, { key: 'Enter' });
    fireEvent.keyDown(frenchInput, { key: 'Enter' });
    expect(frenchInput.value).toEqual('Je veux manger du poulet');
  });
});

describe('when expanded by default', () => {
  it('should render one input per language', () => {
    const { getByLabelText } = renderLocalizedMultilineTextInput({
      defaultExpandLanguages: true,
    });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(getByLabelText('FR')).toBeInTheDocument();
    expect(getByLabelText(/hide languages/i)).toBeInTheDocument();
  });
});

describe('when expansion controls are hidden', () => {
  it('should render one input per language and no hide button', () => {
    const { getByLabelText, queryByLabelText } =
      renderLocalizedMultilineTextInput({
        hideLanguageExpansionControls: true,
      });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(getByLabelText('FR')).toBeInTheDocument();
    expect(queryByLabelText(/hide languages/i)).not.toBeInTheDocument();
  });
});

describe('when disabled', () => {
  describe('when not expanded', () => {
    it('should render a disabled input', () => {
      const { getByLabelText } = renderLocalizedMultilineTextInput({
        isDisabled: true,
      });
      expect(getByLabelText('EN')).toBeDisabled();
    });
  });
  describe('when expanded', () => {
    it('should be able to expand, and all inputs are disabled', async () => {
      const { getByLabelText, findByLabelText } =
        renderLocalizedMultilineTextInput({
          isDisabled: true,
        });
      const showAllLangBtn = await findByLabelText(/show all languages/i);
      fireEvent.click(showAllLangBtn);
      expect(getByLabelText('EN')).toBeDisabled();
      expect(getByLabelText('FR')).toBeDisabled();
    });
  });
});

describe('when read-only', () => {
  describe('when not expanded', () => {
    it('should render a readonly input', () => {
      const { getByLabelText, queryByLabelText } =
        renderLocalizedMultilineTextInput({
          isReadOnly: true,
        });
      expect(getByLabelText('EN')).toHaveAttribute('readonly');
      expect(queryByLabelText('FR')).not.toBeInTheDocument();
    });
  });
  describe('when expanded', () => {
    it('should be able to expand, and all inputs are readonly', async () => {
      const { getByLabelText, findByLabelText } =
        renderLocalizedMultilineTextInput({
          isReadOnly: true,
        });
      const showAllLangBtn = await findByLabelText(/show all languages/i);
      fireEvent.click(showAllLangBtn);
      expect(getByLabelText('EN')).toHaveAttribute('readonly');
      expect(getByLabelText('FR')).toHaveAttribute('readonly');
    });
  });
});

describe('when placeholders are provided', () => {
  it('should forward the placeholders', () => {
    const { getByLabelText } = renderLocalizedMultilineTextInput({
      defaultExpandLanguages: true,
      placeholder: {
        en: 'I love cheese',
        fr: "Ostie que j'aime le fromage",
      },
    });
    expect(getByLabelText('EN')).toHaveAttribute(
      'placeholder',
      'I love cheese'
    );
    expect(getByLabelText('FR')).toHaveAttribute(
      'placeholder',
      "Ostie que j'aime le fromage"
    );
  });
});

describe('when every field should display an error', () => {
  const errors = {
    en: 'A value is required',
    fr: "Ostie, t'as oublier de manger du fromage",
  };
  it('should be open all fields and render errors', () => {
    const { getByLabelText, getByText } = renderLocalizedMultilineTextInput({
      errors,
    });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(getByLabelText('FR')).toBeInTheDocument();
    expect(getByText(errors.en)).toBeInTheDocument();
    expect(getByText(errors.fr)).toBeInTheDocument();
  });
});

describe('when the error is not on the selected language', () => {
  const errors = {
    en: '',
    fr: "Ostie, t'as oublier de manger du fromage",
  };
  it('should be open all fields and render errors', () => {
    const { getByLabelText, getByText } = renderLocalizedMultilineTextInput({
      errors,
    });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(getByLabelText('FR')).toBeInTheDocument();
    expect(getByText(errors.fr)).toBeInTheDocument();
  });
});

describe('when the error is on the selected language', () => {
  it('should display the error without expanding', () => {
    const { getByLabelText, getByText, queryByLabelText } =
      renderLocalizedMultilineTextInput({
        errors: {
          en: 'Some error',
        },
      });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(queryByLabelText('FR')).not.toBeInTheDocument();
    expect(getByText('Some error')).toBeInTheDocument();
  });
});

describe('when the additionalInfo exists on the selected locale should display', () => {
  it('when given string', () => {
    const { getByLabelText, getByText, queryByLabelText } =
      renderLocalizedMultilineTextInput({
        additionalInfo: {
          en: 'Some description',
        },
      });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(queryByLabelText('FR')).not.toBeInTheDocument();
    expect(getByText('Some description')).toBeInTheDocument();
  });
  it('when given intl data', () => {
    const { getByLabelText, getByText, queryByLabelText } =
      renderLocalizedMultilineTextInput({
        additionalInfo: {
          en: { id: 'i18en', defaultMessage: 'english i18n message' },
          fr: { id: 'i18fr', defaultMessage: 'french i18n message' },
        },
      });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(queryByLabelText('FR')).not.toBeInTheDocument();
    expect(getByText('english i18n message')).toBeInTheDocument();
    expect(queryByLabelText('french i18n message')).not.toBeInTheDocument();
  });
  it('when given react element', () => {
    const { getByLabelText, getByText, queryByLabelText } =
      renderLocalizedMultilineTextInput({
        additionalInfo: {
          en: <span>english span element</span>,
          fr: <span>french span element</span>,
        },
      });
    expect(getByLabelText('EN')).toBeInTheDocument();
    expect(queryByLabelText('FR')).not.toBeInTheDocument();
    expect(getByText('english span element')).toBeInTheDocument();
    expect(queryByLabelText('french span element')).not.toBeInTheDocument();
  });
});
