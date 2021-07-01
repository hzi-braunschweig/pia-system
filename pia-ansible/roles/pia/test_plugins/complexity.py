# # Example usage in ansible playbook
#
# - name: Complexity playground
#   hosts: localhost
#   vars:
#     password_len_failure: dhdh
#     password_no_uppercase: sohdiiceephaizeegaivaiceliewoone
#     password_no_digits: ashahthahlohzoongoyaGheegeeweiph
#     password_ok: shaephaezahh3iegee0Ung9ocei7aegh
#     very_weak_password: a
#
#   tasks:
#
#     - name: Test
#       assert:
#         that:
#           - password_len_failure is complex_enough
#           - password_no_uppercase is complex_enough
#           - password_no_digits is complex_enough
#           - password_ok is complex_enough
#           - very_weak_password is complex_enough(minimal_length=1, contains_upper_case=False, contains_digit=False)
#         fail_msg: "One of passwords are not complex enough"
#         success_msg: "Passwords are good to go!"

from ansible.utils.display import Display
display = Display()

class TestModule(object):

    def tests(self):
        return {
            'complex_enough': self._test,
        }

    def _test(self,
        password:str,
        minimal_length:int = 32,
        contains_upper_case:bool = True,
        contains_digit:bool = True
    ):
        msg = f"password:**** minimal_length:{minimal_length} contains_upper_case:{contains_upper_case} contains_digit:{contains_digit}"
        display.verbose(msg)

        if len(password) < minimal_length:
            display.warning(f"Password is shorter than {minimal_length}")
            return False

        if contains_upper_case and password == password.lower():
            display.warning("Password does not contain any upper case character")
            return False

        if contains_digit and not True in map(lambda x: x.isdigit(), password):
            display.warning("Password does not contain any digit")
            return False

        return True
