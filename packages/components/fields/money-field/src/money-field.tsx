import {
  Component,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import has from 'lodash/has';
import { type Props as ReactSelectProps } from 'react-select';
import {
  filterDataAttributes,
  createSequentialId,
  getFieldId,
  warning,
} from '@commercetools-uikit/utils';
import Constraints from '@commercetools-uikit/constraints';
import Spacings from '@commercetools-uikit/spacings';
import FieldLabel, { type TIconProps } from '@commercetools-uikit/field-label';
import MoneyInput, {
  type TCurrencyCode,
} from '@commercetools-uikit/money-input';
import FieldErrors from '@commercetools-uikit/field-errors';
import FieldWarnings from '@commercetools-uikit/field-warnings';

type TErrorRenderer = (key: string, error?: boolean) => ReactNode;
type TFieldWarnings = Record<string, boolean>;
type TFieldErrors = Record<string, boolean>;
// Similar shape of `FormikErrors` but values are `TFieldErrors` objects.
type TCustomFormErrors<Values> = {
  [K in keyof Values]?: TFieldErrors;
};

type TTouched = {
  amount?: boolean;
  currencyCode?: boolean;
};

const sequentialId = createSequentialId('money-field-');

const hasErrors = (errors?: TFieldErrors) =>
  errors && Object.values(errors).some(Boolean);

const hasWarnings = (warnings?: TFieldWarnings) =>
  warnings && Object.values(warnings).some(Boolean);

type TValue = {
  amount: string;
  currencyCode: TCurrencyCode;
};

type TCustomEvent = {
  target: {
    id?: string;
    name?: string;
    value?: string | string[] | null;
  };
  persist?: () => void;
};

export type TMoneyFieldProps = {
  // MoneyField
  /**
   * Used as HTML id property. An id is auto-generated when it is not specified.
   */
  id?: string;
  /**
   * Horizontal size limit of the input fields.
   */
  horizontalConstraint?:
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16
    | 'scale'
    | 'auto';
  /**
   * A map of errors. Error messages for known errors are rendered automatically.
   * <br />
   * Unknown errors will be forwarded to `renderError`
   */
  errors?: TFieldErrors;
  /**
   * A map of warnings. Warning messages for known warnings are rendered automatically.
   * <br/>
   * Unknown warnings will be forwarded to renderWarning.
   */
  warnings?: TFieldWarnings;
  /**
   * Called with custom errors. This function can return a message which will be wrapped in an ErrorMessage. It can also return null to show no error.
   */
  renderError?: TErrorRenderer;
  /**
   * Called with custom warnings, as renderWarning(key, warning). This function can return a message which will be wrapped in a WarningMessage.
   * <br />
   * It can also return null to show no warning.
   */
  renderWarning?: (key: string, warning?: boolean) => ReactNode;
  /**
   * Indicates if the value is required. Shows an the "required asterisk" if so.
   */
  isRequired?: boolean;
  /**
   * Indicates whether the `currencyCode` or `amount` fields were touched.
   * <br />
   * Errors will only be shown when the field was touched.
   */
  touched?: TTouched;

  // Some other fields use isTouched, but the check isn't as simple here.
  // isTouched accepts a boolean, whereas touched takes an object.
  // Maybe we should upgrade them all to just be "touched"?
  isTouched?: unknown;

  // MoneyInput
  /**
   * Used as HTML `autocomplete` property
   */
  autoComplete?: string;
  /**
   * The prefix used to create a HTML `name` property for the amount input field (`${name}.amount`) and the currency dropdown (`${name}.currencyCode`).
   */
  name?: string;
  /**
   * Value of the input. Consists of the currency code and an amount. `amount` is a string representing the amount. A dot has to be used as the decimal separator.
   */
  value: TValue;
  /**
   * List of possible currencies. When not provided or empty, the component renders a label with the value's currency instead of a dropdown.
   */
  currencies?: string[];
  /**
   * Placeholder text for the amount input
   */
  placeholder?: string;
  /**
   * Called when input is blurred
   */
  onBlur?: (event: TCustomEvent) => void;
  /**
   * Called when input is focused
   */
  onFocus?: (event: TCustomEvent) => void;
  /**
   * Indicates that the input cannot be modified (e.g not authorized, or changes currently saving).
   */
  isDisabled?: boolean;
  /**
   * Indicates that the field is displaying read-only content
   */
  isReadOnly?: boolean;
  /**
   * Focus the input on initial render
   */
  isAutofocussed?: boolean;
  /**
   * Called with the event of the input or dropdown when either the currency or the amount have changed.
   */
  onChange?: (event: TCustomEvent) => void;
  /**
   * Dom element to portal the currency select menu to
   * <br>
   * [Props from React select was used](https://react-select.com/props)
   */
  menuPortalTarget?: ReactSelectProps['menuPortalTarget'];
  /**
   * z-index value for the currency select menu portal
   * <br>
   * Use in conjunction with `menuPortalTarget`
   */
  menuPortalZIndex?: number;
  /**
   * whether the menu should block scroll while open
   * <br>
   * [Props from React select was used](https://react-select.com/props)
   */
  menuShouldBlockScroll?: ReactSelectProps['menuShouldBlockScroll'];

  // LabelField
  /**
   * Title of the label
   */
  title: string | ReactNode;
  /**
   * Hint for the label. Provides a supplementary but important information regarding the behaviour of the input (e.g warn about uniqueness of a field, when it can only be set once), whereas `description` can describe it in more depth. Can also receive a `hintIcon`.
   */
  hint?: string | ReactNode;
  /**
   * Provides a description for the title.
   */
  description?: string | ReactNode;
  /**
   * Function called when info button is pressed.
   * <br />
   * Info button will only be visible when this prop is passed.
   */
  onInfoButtonClick?: () => void;
  /**
   * Icon to be displayed beside the hint text.
   * <br />
   * Will only get rendered when `hint` is passed as well.
   */
  hintIcon?: ReactElement<TIconProps>;
  /**
   * Shows high precision badge in case current value uses high precision.
   */
  hasHighPrecisionBadge?: boolean;
  /**
   * Indicates that the currency input cannot be modified.
   */
  isCurrencyInputDisabled?: boolean;
};

type TMoneyFieldState = Pick<TMoneyFieldProps, 'id'>;

class MoneyField extends Component<TMoneyFieldProps, TMoneyFieldState> {
  static displayName = 'MoneyField';

  static defaultProps = {
    horizontalConstraint: 'scale',
  };

  state = {
    // We generate an id in case no id is provided by the parent to attach the
    // label to the input component.
    id: this.props.id,
  };

  static getDerivedStateFromProps = (
    props: TMoneyFieldProps,
    state: TMoneyFieldState
  ) => ({
    id: getFieldId(props, state, sequentialId),
  });

  /**
   * Use this function to convert the Formik `errors` object type to
   * our custom field errors type.
   * This is primarly useful when using TypeScript.
   */
  static toFieldErrors<FormValues>(
    errors: unknown
  ): TCustomFormErrors<FormValues> {
    return errors as TCustomFormErrors<FormValues>;
  }

  render() {
    // MoneyInput.isTouched() ensures both fields have been touched.
    // This avoids showing an error when the user just selected a language but
    // didn't add an amount yet.
    const hasError =
      MoneyInput.isTouched(this.props.touched) && hasErrors(this.props.errors);

    const hasWarning =
      MoneyInput.isTouched(this.props.touched) &&
      hasWarnings(this.props.warnings);

    if (!this.props.isReadOnly) {
      warning(
        typeof this.props.onChange === 'function',
        'MoneyField: `onChange` is required when field is not read only.'
      );
    }

    warning(
      !has(this.props, 'isTouched'),
      'MoneyField:  Invalid prop isTouched supplied to MoneyField. Use touched instead.'
    );

    if (this.props.hintIcon) {
      warning(
        typeof this.props.hint === 'string' || isValidElement(this.props.hint),
        'MoneyField: `hint` is required to be string or ReactNode if hintIcon is present'
      );
    }

    const errorsContainerId = `${this.state.id}-errors`;
    const warningsContainerId = `${this.state.id}-warnings`;

    return (
      <Constraints.Horizontal max={this.props.horizontalConstraint}>
        <Spacings.Stack scale="xs">
          <FieldLabel
            title={this.props.title}
            hint={this.props.hint}
            description={this.props.description}
            onInfoButtonClick={this.props.onInfoButtonClick}
            hintIcon={this.props.hintIcon}
            hasRequiredIndicator={this.props.isRequired}
            htmlFor={this.state.id}
          />
          <MoneyInput
            id={this.state.id}
            name={this.props.name}
            autoComplete={this.props.autoComplete}
            value={this.props.value}
            currencies={this.props.currencies}
            placeholder={this.props.placeholder}
            onFocus={this.props.onFocus}
            onBlur={this.props.onBlur}
            isDisabled={this.props.isDisabled}
            isAutofocussed={this.props.isAutofocussed}
            isReadOnly={this.props.isReadOnly}
            onChange={this.props.onChange}
            hasError={hasError}
            hasWarning={hasWarning}
            hasHighPrecisionBadge={this.props.hasHighPrecisionBadge}
            menuPortalTarget={this.props.menuPortalTarget}
            menuPortalZIndex={this.props.menuPortalZIndex}
            menuShouldBlockScroll={this.props.menuShouldBlockScroll}
            {...filterDataAttributes(this.props)}
            aria-invalid={hasError}
            aria-errormessage={errorsContainerId}
            isCurrencyInputDisabled={this.props.isCurrencyInputDisabled}
          />
          <FieldErrors
            id={errorsContainerId}
            errors={this.props.errors}
            isVisible={hasError}
            renderError={this.props.renderError}
          />
          <FieldWarnings
            id={warningsContainerId}
            warnings={this.props.warnings}
            isVisible={hasWarning}
            renderWarning={this.props.renderWarning}
          />
        </Spacings.Stack>
      </Constraints.Horizontal>
    );
  }
}

export default MoneyField;
