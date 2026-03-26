import Button from '../ui/Button';
import Input from '../ui/Input';

const TenantForm = () => (
  <form className="tenant-form space-y-3">
    <Input label="Name" name="name" placeholder="Jane Tenant" />
    <Input label="Unit" name="unit" placeholder="Block B · Unit 2" />
    <Button type="submit">Add tenant</Button>
  </form>
);

export default TenantForm;

