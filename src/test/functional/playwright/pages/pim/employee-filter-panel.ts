import {FilterPanel} from '../base-ui-elements/filter-panel';

/** The Employee Information filters of the Employee List */
export class EmployeeFilterPanel extends FilterPanel {
  readonly employeeName = this.autocomplete('Employee Name');
  readonly employeeId = this.text('Employee Id');
  /** Current Employees Only (default), Current and Past Employees, Past Employees Only */
  readonly include = this.select('Include');

  readonly resetButton = this.button('Reset');
}
