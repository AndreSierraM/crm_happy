import { Avatar } from '@ui/primitives/data-display/Avatar/Avatar';
import { type Agenda } from '../../shared/types/Agenda';

export const WorkspaceIcon = ({
  workspace,
}: {
  workspace: Agenda['workspace'] | null;
}) => (
  <span aria-hidden="true" className="workspace-avatar">
    <Avatar
      src={workspace?.logoUrl || './happy.png'}
      name={workspace?.name ?? 'Happy CRM'}
      size="lg"
      shape="square"
    />
  </span>
);
