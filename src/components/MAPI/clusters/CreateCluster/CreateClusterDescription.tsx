import { getClusterDescription } from 'MAPI/utils';
import { Constants } from 'model/constants';
import React, { useEffect, useRef, useState } from 'react';
import InputGroup from 'UI/Inputs/InputGroup';
import TextInput from 'UI/Inputs/TextInput';
import { hasAppropriateLength } from 'utils/helpers';

import { IClusterPropertyProps, withClusterDescription } from './patches';

function validateValue(newValue: string, newValueLabel: string): string {
  const { message } = hasAppropriateLength(
    newValue,
    Constants.MIN_NAME_LENGTH,
    Constants.MAX_NAME_LENGTH,
    newValueLabel
  );

  return message;
}

interface ICreateClusterDescriptionProps
  extends IClusterPropertyProps,
    Omit<
      React.ComponentPropsWithoutRef<typeof InputGroup>,
      'onChange' | 'id'
    > {}

const CreateClusterDescription: React.FC<ICreateClusterDescriptionProps> = ({
  id,
  cluster,
  providerCluster,
  onChange,
  readOnly,
  disabled,
  autoFocus,
  ...props
}) => {
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validationResult = validateValue(e.target.value, 'Description');
    setValidationError(validationResult);

    onChange({
      isValid: validationResult.length < 1,
      patch: withClusterDescription(e.target.value),
    });
  };

  const value = getClusterDescription(cluster, providerCluster, '');

  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!textInputRef.current || !autoFocus) return;

    textInputRef.current.select();

    // Only run for the initial render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <InputGroup htmlFor={id} label='Description' {...props}>
      <TextInput
        value={value}
        id={id}
        error={validationError}
        onChange={handleChange}
        help='Pick a description that helps team mates to understand what the cluster is for. You can change this later.'
        readOnly={readOnly}
        disabled={disabled}
        autoFocus={autoFocus}
        ref={textInputRef}
      />
    </InputGroup>
  );
};

export default CreateClusterDescription;
